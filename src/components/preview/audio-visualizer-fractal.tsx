
"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { $audio } from "@/lib/audio";
import { useAudioStore } from "@/lib/audio-store";
import { audioVisualizerContext } from "@/lib/audio-visualizer-context";

// Move color parser outside component to avoid recreation on each render
const parseColor = (str: string, fallback: THREE.Vector3): THREE.Vector3 => {
  if (!str) return fallback;
  const cleanStr = str.trim();

  // 1. Try THREE.Color directly (Supports Hex, RGB, some HSL)
  try {
    if (!cleanStr.startsWith('oklch')) {
      const c = new THREE.Color(cleanStr);
      return new THREE.Vector3(c.r, c.g, c.b);
    }
  } catch (e) {
    // Ignore and try next
  }

  // 2. Manual OKLCH Parser
  if (cleanStr.includes('oklch')) {
    try {
      const match = cleanStr.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/) ||
        cleanStr.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/\s*[\d.]+\)/);
      if (match) {
        const L = parseFloat(match[1]);
        const C = parseFloat(match[2]);
        const H = parseFloat(match[3]);

        if (C < 0.01) return new THREE.Vector3(L, L, L);

        const h_rad = (H * Math.PI) / 180;
        const a = C * Math.cos(h_rad);
        const b_val = C * Math.sin(h_rad);

        const l_ = L + 0.3963377774 * a + 0.2158037573 * b_val;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b_val;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b_val;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        let b_final = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const gamma = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.abs(c), 1.0 / 2.4) - 0.055;

        return new THREE.Vector3(
          Math.max(0, Math.min(1, gamma(r))),
          Math.max(0, Math.min(1, gamma(g))),
          Math.max(0, Math.min(1, gamma(b_final)))
        );
      }
    } catch (e) { }
  }

  // 3. Manual HSL / Space-Separated Parser
  try {
    let s = cleanStr.replace(/hsl\(|\)|%|deg|,|\//g, ' ');
    let parts = s.split(' ').filter(x => x && x.trim() !== '').map(parseFloat);
    if (parts.length >= 3) {
      const h = parts[0] / 360;
      const sat = parts[1] <= 1 ? parts[1] : parts[1] / 100;
      const lig = parts[2] <= 1 ? parts[2] : parts[2] / 100;
      const c = new THREE.Color();
      c.setHSL(h, sat, lig);
      return new THREE.Vector3(c.r, c.g, c.b);
    }
  } catch (e) { }

  return fallback;
};

// Default color vectors (reusable, avoid allocation)
const DEFAULT_BG = new THREE.Vector3(0, 0, 0);
const DEFAULT_PRIMARY = new THREE.Vector3(0.5, 0.5, 0.5);

export function AudioVisualizerFractal({ theme, mode }: { theme?: any, mode?: 'light' | 'dark' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // State for smooth transitions (avoid re-renders)
  const stateRef = useRef({
    zoom: 1.0,
    opacity: 0.0,
    lastTime: 0
  });

  const isPlaying = useAudioStore((s) => s.isPlaying);
  const [isReady, setIsReady] = React.useState(false);

  // 1. Audio Connection (One-time, passive)
  useEffect(() => {
    const connect = () => {
      const el = $audio.getAudioElement();
      if (!el) return;
      const { analyser, dataArray } = audioVisualizerContext.setupAudio(el);
      if (analyser && dataArray) {
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
      }
    };
    connect();
    if (isPlaying) connect();
  }, [isPlaying]);

  // 2. Theme Color Updates
  useEffect(() => {
    if (!materialRef.current || !theme) return;

    const style = theme.styles[mode || 'light'];

    const b = parseColor(style['--background'] || style['background'], DEFAULT_BG);
    const p = parseColor(style['--primary'] || style['primary'], DEFAULT_PRIMARY);
    const a = parseColor(style['--accent'] || style['accent'], DEFAULT_PRIMARY);
    const c1 = parseColor(style['--chart-1'] || style['chart-1'], p);
    const c2 = parseColor(style['--chart-2'] || style['chart-2'], a);
    const c3 = parseColor(style['--chart-3'] || style['chart-3'], p);

    const u = materialRef.current.uniforms;
    u.iColorPrimary.value.copy(p);
    u.iColorAccent.value.copy(a);
    u.iColorBackground.value.copy(b);
    if (u.iColorChart1) u.iColorChart1.value.copy(c1);
    if (u.iColorChart2) u.iColorChart2.value.copy(c2);
    if (u.iColorChart3) u.iColorChart3.value.copy(c3);
  }, [theme, mode, isReady]);

  // 3. WebGL Setup & Loop
  useEffect(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false }); // antialias off for perf
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(w, h, 1) },
      iZoom: { value: 1.0 },
      iAudioBass: { value: 0 },
      iOpacity: { value: 0.0 },
      iColorPrimary: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
      iColorAccent: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
      iColorBackground: { value: new THREE.Vector3(0, 0, 0) },
      iColorChart1: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
      iColorChart2: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
      iColorChart3: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float iTime;
        uniform vec3 iResolution;
        uniform float iZoom;
        uniform float iAudioBass;
        uniform float iOpacity;
        uniform vec3 iColorPrimary;
        uniform vec3 iColorAccent;
        uniform vec3 iColorBackground;
        uniform vec3 iColorChart1;
        uniform vec3 iColorChart2;
        uniform vec3 iColorChart3;
        varying vec2 vUv;

        void main() {
          vec2 uv = (vUv - 0.5) * iResolution.xy / iResolution.y;
          vec2 c = uv / iZoom + vec2(-0.743643, 0.131825);
          vec2 z = vec2(0.0);
          float iter = 0.0;
          float d = 100.0;

          for (float i = 0.0; i < 100.0; i++) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            if (dot(z, z) > 4.0) break;
            d = min(d, length(z));
            iter++;
          }

          vec3 col = vec3(0.0);
          if (iter < 100.0) {
            float t = iTime + iter * 0.1;
            vec3 palette1 = mix(iColorChart1, iColorChart2, 0.5 + 0.5 * sin(t * 0.7));
            vec3 palette2 = mix(iColorChart3, iColorPrimary, 0.5 + 0.5 * cos(t * 1.1));
            vec3 finalColor = mix(palette1, palette2, 0.5 + 0.5 * sin(iter * 0.2 - t));
            col = mix(iColorBackground, finalColor, exp(-d * 4.0));
            col += iColorAccent * 0.2 * (0.5 + 0.5 * sin(t * 3.0 + iter * 0.5)) * exp(-d * 2.0);
          } else {
            col = iColorBackground;
          }
          col *= (0.8 + 0.4 * iAudioBass);
          gl_FragColor = vec4(col, iOpacity);
        }
      `
    });
    materialRef.current = material;
    setIsReady(true);

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    const scene = new THREE.Scene();
    scene.add(mesh);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Cache audio store reference for animation loop
    const audioStore = useAudioStore;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const state = stateRef.current;
      const isCurrentlyPlaying = audioStore.getState().isPlaying;

      // Calculate target opacity
      const targetOp = isCurrentlyPlaying ? 1.0 : 0.0;
      state.opacity += (targetOp - state.opacity) * 0.05;

      // Skip heavy computation when fully invisible
      if (state.opacity < 0.01 && !isCurrentlyPlaying) {
        material.uniforms.iOpacity.value = 0;
        renderer.render(scene, camera);
        return;
      }

      // Audio Data
      let bass = 0;
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let i = 0; i < 10; i++) sum += dataArray[i];
        bass = sum / 2550; // Optimized: 10 * 255 = 2550
      }

      // Infinite Zoom Loop
      state.zoom *= (1.002 + bass * 0.005);
      if (state.zoom > 50000.0) {
        state.zoom = 1.0;
      }

      material.uniforms.iTime.value += 0.01 + bass * 0.02;
      material.uniforms.iZoom.value = state.zoom;
      material.uniforms.iAudioBass.value = bass;
      material.uniforms.iOpacity.value = state.opacity;

      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      renderer.setSize(width, height);
      material.uniforms.iResolution.value.set(width, height, 1);
    };
    window.addEventListener('resize', resize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />;
}