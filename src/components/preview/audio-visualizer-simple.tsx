"use client";

import React, { useEffect, useRef, useState } from "react";
import { $audio } from "@/lib/audio";
import { useAudioStore } from "@/lib/audio-store";

export function AudioVisualizerSimple() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const animationRef = useRef<number | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
	const backgroundPhase = useRef(0);
	
	const isPlaying = useAudioStore((s) => s.isPlaying);

	// Resume audio context when playing starts
	useEffect(() => {
		if (isPlaying && audioContextRef.current && audioContextRef.current.state === 'suspended') {
			audioContextRef.current.resume();
		}
	}, [isPlaying]);

	useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Setup audio context when audio element is available
		const setupAudio = () => {
			const audioElement = $audio.getAudioElement();
			if (!audioElement) {
				console.log("No audio element yet");
				return;
			}
			
			// Don't create multiple sources
			if (sourceRef.current) {
				console.log("Audio already connected");
				return;
			}

			try {
				// Create or reuse audio context
				if (!audioContextRef.current) {
					audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
					console.log("Created audio context");
				}
				
				// Create analyser
				analyserRef.current = audioContextRef.current.createAnalyser();
				analyserRef.current.fftSize = 256;
				analyserRef.current.smoothingTimeConstant = 0.8;
				
				// Create source from audio element
				sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
				
				// Connect nodes
				sourceRef.current.connect(analyserRef.current);
				analyserRef.current.connect(audioContextRef.current.destination);
				
				// Create data array
				const bufferLength = analyserRef.current.frequencyBinCount;
				dataArrayRef.current = new Uint8Array(bufferLength);
				
				console.log("Audio visualization connected successfully");
			} catch (error) {
				console.error("Audio context setup failed:", error);
			}
		};

		// Try to setup audio immediately and after a delay
		setupAudio();
		const timer = setTimeout(setupAudio, 100);
		
		// Get theme colors
		const getThemeColors = () => {
			const container = canvas.closest('[style*="--primary"]') || document.documentElement;
			const style = getComputedStyle(container);
			
			// Get foreground and chart colors for waveforms
			const waveformColors = [
				'--foreground',
				'--primary',
				'--secondary',
				'--accent',
				'--chart-1',
				'--chart-2',
				'--chart-3',
				'--chart-4',
				'--chart-5'
			];
			
			// Get background colors for fading (darker colors)
			const backgroundColors = [
				'--background',
				'--card',
				'--muted'
			];
			
			// Handle both HSL and OKLCH formats
			const formatColor = (color: string) => {
				if (!color) return null;
				if (color.startsWith('oklch(')) {
					return color;
				} else {
					return `hsl(${color})`;
				}
			};
			
			const waveColors = waveformColors
				.map(varName => {
					const raw = style.getPropertyValue(varName).trim();
					return formatColor(raw);
				})
				.filter(Boolean);
				
			const bgColors = backgroundColors
				.map(varName => {
					const raw = style.getPropertyValue(varName).trim();
					return formatColor(raw);
				})
				.filter(Boolean);
			
			// Fallbacks
			if (waveColors.length < 3) {
				const primary = formatColor(style.getPropertyValue('--primary').trim()) || 'hsl(220 90% 56%)';
				const accent = formatColor(style.getPropertyValue('--accent').trim()) || 'hsl(280 80% 60%)';
				waveColors.push(primary, accent, primary);
			}
			
			if (bgColors.length < 2) {
				bgColors.push('hsl(0 0% 9%)', 'hsl(0 0% 12%)');
			}
			
			return { waveColors, bgColors };
		};

		// Animation loop
		const draw = () => {
			animationRef.current = requestAnimationFrame(draw);

			const { waveColors, bgColors } = getThemeColors();
			
			if (!analyserRef.current || !dataArrayRef.current) {
				// Draw a placeholder wave when no audio context is available
				ctx.fillStyle = bgColors[0];
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				ctx.strokeStyle = waveColors[0];
				ctx.globalAlpha = 0.3;
				ctx.lineWidth = 2;
				ctx.beginPath();
				const sliceWidth = canvas.width / 50;
				for (let i = 0; i < 50; i++) {
					const x = i * sliceWidth;
					const y = canvas.height / 2 + Math.sin(i * 0.2 + Date.now() * 0.001) * 20;
					if (i === 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}
				ctx.stroke();
				ctx.globalAlpha = 1;
				return;
			}

			// Get waveform data for smooth visualization
			analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
			
			// Get frequency data for splitting into bands
			const freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
			analyserRef.current.getByteFrequencyData(freqData);
			
			// Calculate bass intensity for subtle background changes
			const bassIntensity = Math.min(1, Array.from(freqData.slice(0, 8)).reduce((a, b) => a + b, 0) / (8 * 200));
			
			// Update background phase very slowly for smooth transitions
			backgroundPhase.current += 0.001 + (bassIntensity * 0.002);
			
			// Create smooth gradient background with dark colors
			const bgGradient = ctx.createRadialGradient(
				canvas.width / 2, canvas.height / 2, 0,
				canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
			);
			
			// Use smooth interpolation between colors
			const phase = backgroundPhase.current;
			const bgIndex = Math.floor(phase) % bgColors.length;
			const nextIndex = (bgIndex + 1) % bgColors.length;
			const mixAmount = phase % 1; // Fractional part for smooth mixing
			
			// Interpolate between colors smoothly
			if (mixAmount < 0.5) {
				bgGradient.addColorStop(0, bgColors[bgIndex]);
				bgGradient.addColorStop(0.5 + bassIntensity * 0.1, bgColors[bgIndex]);
				bgGradient.addColorStop(1, bgColors[nextIndex]);
			} else {
				bgGradient.addColorStop(0, bgColors[nextIndex]);
				bgGradient.addColorStop(0.5 + bassIntensity * 0.1, bgColors[bgIndex]);
				bgGradient.addColorStop(1, bgColors[bgIndex]);
			}
			
			ctx.fillStyle = bgGradient;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const bufferLength = dataArrayRef.current.length;
			const sliceWidth = canvas.width / bufferLength * 2;
			
			// Draw multiple reactive waveforms
			const waveCount = Math.min(waveColors.length, 6);
			const bandSize = Math.floor(freqData.length / waveCount);
			const heightPerWave = canvas.height / waveCount;
			
			for (let band = 0; band < waveCount; band++) {
				// Calculate frequency band intensity for reactive movement
				let bandIntensity = 0;
				const startIdx = band * bandSize;
				const endIdx = Math.min((band + 1) * bandSize, freqData.length);
				for (let i = startIdx; i < endIdx; i++) {
					bandIntensity += freqData[i];
				}
				bandIntensity = bandIntensity / (endIdx - startIdx) / 255;
				
				// Draw main waveform that moves with the music
				ctx.beginPath();
				ctx.strokeStyle = waveColors[band % waveColors.length];
				ctx.lineWidth = 1 + bandIntensity * 4;
				ctx.globalAlpha = 0.5 + bandIntensity * 0.5;
				ctx.lineJoin = 'round';
				
				// Dynamic center position based on frequency intensity
				const baseCenterY = (band + 0.5) * heightPerWave;
				// Move the waveform up and down based on its frequency band
				const verticalOffset = Math.sin(Date.now() * 0.001 + band) * bandIntensity * 20;
				const centerY = baseCenterY + verticalOffset;
				
				// Amplitude changes with intensity
				const amplitude = (heightPerWave * 0.4) * (0.5 + bandIntensity);
				
				// Draw with smooth curves
				const step = 2;
				let x = 0;
				for (let i = 0; i < bufferLength; i += step) {
					const v = dataArrayRef.current[i] / 128.0;
					// Add some frequency-based modulation to make it more dynamic
					const freqModulation = 1 + (freqData[Math.min(i, freqData.length - 1)] / 255) * 0.5;
					const y = centerY + ((v - 1) * amplitude * freqModulation);
					
					if (i === 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
					x += sliceWidth * step;
				}
				
				ctx.stroke();
				
				// Draw mirror wave for depth
				ctx.beginPath();
				ctx.globalAlpha = 0.2 + bandIntensity * 0.2;
				x = 0;
				for (let i = 0; i < bufferLength; i += step) {
					const v = dataArrayRef.current[i] / 128.0;
					const freqModulation = 1 + (freqData[Math.min(i, freqData.length - 1)] / 255) * 0.5;
					const y = centerY - ((v - 1) * amplitude * freqModulation * 0.8);
					
					if (i === 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
					x += sliceWidth * step;
				}
				ctx.stroke();
			}
			
			ctx.globalAlpha = 1;
		};

		// Start animation
		draw();

		// Handle resize
		const handleResize = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};
		
		handleResize();
		window.addEventListener('resize', handleResize);

		return () => {
			clearTimeout(timer);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			window.removeEventListener('resize', handleResize);
		};
	}, []); // Only run once on mount

	return (
		<div ref={containerRef} className="rounded-xl border shadow-sm h-full relative overflow-hidden">
			<canvas 
				ref={canvasRef} 
				className="w-full h-full"
				style={{ display: 'block' }}
			/>
		</div>
	);
}