"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { $audio } from "@/lib/audio";
import { useAudioStore } from "@/lib/audio-store";

export function AudioVisualizer3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const analyserRef = useRef<THREE.AudioAnalyser | null>(null);
  const uniformsRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);

  const isPlaying = useAudioStore((s) => s.isPlaying);

  useEffect(() => {
    if (!containerRef.current) return;

    const fftSize = 128;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera - orthographic for 2D visualization
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Renderer with transparent background
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent background
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup audio with Web Audio API directly
    const audioElement = $audio.getAudioElement();
    if (audioElement) {
      try {
        // Create Web Audio API context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create source from audio element
        const source = audioContext.createMediaElementSource(audioElement);

        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;

        // Connect nodes
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // Store frequency data
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Create Three.js audio analyser wrapper
        analyserRef.current = {
          getFrequencyData: () => {
            analyser.getByteFrequencyData(dataArray as any);
            return dataArray;
          },
          data: dataArray
        } as any;

        // Create uniforms for shader
        const dataTexture = new THREE.DataTexture(
          dataArray,
          fftSize / 2,
          1,
          THREE.RedFormat
        );
        dataTexture.needsUpdate = true;

        uniformsRef.current = {
          tAudioData: { value: dataTexture },
          time: { value: 0.0 }
        };

        // Vertex shader
        const vertexShader = `
					varying vec2 vUv;
					void main() {
						vUv = uv;
						gl_Position = vec4(position, 1.0);
					}
				`;

        // Get theme colors from the container element (where theme is applied)
        // We need to walk up to find the element with the theme styles
        const themeContainer = containerRef.current.closest('[style*="--primary"]') || document.documentElement;
        const computedStyle = getComputedStyle(themeContainer);
        const primaryHsl = computedStyle.getPropertyValue('--primary').trim().split(' ');
        const accentHsl = computedStyle.getPropertyValue('--accent').trim().split(' ');

        // Convert HSL to RGB for shader
        const hslToRgb = (h: number, s: number, l: number) => {
          h = h / 360;
          s = s / 100;
          l = l / 100;
          let r, g, b;
          if (s === 0) {
            r = g = b = l;
          } else {
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1 / 6) return p + (q - p) * 6 * t;
              if (t < 1 / 2) return q;
              if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
              return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
          }
          return [r, g, b];
        };

        const primaryRgb = hslToRgb(
          parseFloat(primaryHsl[0] || "220"),
          parseFloat(primaryHsl[1]?.replace('%', '') || "90"),
          parseFloat(primaryHsl[2]?.replace('%', '') || "65")
        );

        const accentRgb = hslToRgb(
          parseFloat(accentHsl[0] || "280"),
          parseFloat(accentHsl[1]?.replace('%', '') || "80"),
          parseFloat(accentHsl[2]?.replace('%', '') || "60")
        );

        // Fragment shader with theme colors and glow effect
        const fragmentShader = `
					uniform sampler2D tAudioData;
					uniform float time;
					varying vec2 vUv;
					
					void main() {
						vec3 primaryColor = vec3(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]});
						vec3 accentColor = vec3(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]});
						
						// Sample frequency data
						float f = texture2D(tAudioData, vec2(vUv.x, 0.0)).r;
						
						// Scale and position the waveform  
						float waveHeight = 0.5 - f * 0.4;
						
						// Create the waveform line with thickness
						float dist = abs(vUv.y - waveHeight);
						float line = 1.0 - smoothstep(0.0, 0.01, dist);
						
						// Add glow around the line
						float glow = exp(-dist * 15.0) * f;
						
						// Mix colors based on frequency
						vec3 color = mix(primaryColor, accentColor, vUv.x);
						
						// Pulse effect
						float pulse = sin(time * 3.0 + vUv.x * 10.0) * 0.1 + 0.9;
						
						vec3 finalColor = color * (line + glow * pulse);
						float alpha = line + glow * 0.5;
						
						gl_FragColor = vec4(finalColor, alpha);
					}
				`;

        // Create material with shaders
        const material = new THREE.ShaderMaterial({
          uniforms: uniformsRef.current,
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          transparent: true
        });

        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

      } catch (error) {
        console.warn("Could not setup Three.js Audio:", error);
      }
    }

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Update frequency data and time
      if (analyserRef.current && uniformsRef.current) {
        const data = analyserRef.current.getFrequencyData();

        // Update the texture with frequency data
        if (data && uniformsRef.current.tAudioData.value.image) {
          for (let i = 0; i < data.length; i++) {
            uniformsRef.current.tAudioData.value.image.data[i] = data[i];
          }
          uniformsRef.current.tAudioData.value.needsUpdate = true;
        }

        uniformsRef.current.time.value = Date.now() * 0.001;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []); // Only setup once

  return (
    <div className="rounded-xl border bg-card shadow-sm h-full relative overflow-hidden">
      <div ref={containerRef} className="w-full h-full" style={{ background: 'var(--card)' }} />
    </div>
  );
}