"use client";

import React, { useEffect, useRef } from "react";
import { $audio } from "@/lib/audio";
import { useAudioStore } from "@/lib/audio-store";
import { audioVisualizerContext } from "@/lib/audio-visualizer-context";

export function AudioVisualizerFractal() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array | null>(null);
	const zoomRef = useRef(1);
	const rotationRef = useRef(0);
	const offsetXRef = useRef(0);
	const offsetYRef = useRef(0);
	
	const isPlaying = useAudioStore((s) => s.isPlaying);

	// Setup audio ONCE and keep it connected
	useEffect(() => {
		const setupAudio = () => {
			const audioElement = $audio.getAudioElement();
			if (!audioElement) return;
			
			const { analyser, dataArray } = audioVisualizerContext.setupAudio(audioElement);
			analyserRef.current = analyser;
			dataArrayRef.current = dataArray;
		};

		setupAudio();
		const timer = setTimeout(setupAudio, 100);
		
		return () => clearTimeout(timer);
	}, []); // Only run once on mount
	
	// Resume audio context when playing starts
	useEffect(() => {
		if (isPlaying) {
			audioVisualizerContext.resume();
		}
	}, [isPlaying]);

	// Animation loop 
	useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) return;
		
		// Get theme colors - reads from the preview container every frame
		const getThemeColors = () => {
			// Find the preview container with theme variables
			const container = canvas.closest('[style*="--primary"]');
			console.log('Container found:', container?.tagName, container?.className);
			
			if (!container) {
				console.log('NO CONTAINER WITH THEME VARS FOUND');
				// Return transparent if no theme found
				return null;
			}
			
			// Check if we're in dark mode
			const isDarkMode = container.closest('.dark') !== null;
			console.log('Dark mode:', isDarkMode);
			const style = getComputedStyle(container);
			
			const colorVars = [
				'--primary',
				'--secondary', 
				'--accent',
				'--chart-1',
				'--chart-2',
				'--chart-3',
				'--chart-4',
				'--chart-5'
			];
			
			const formatColor = (rawValue: string) => {
				if (!rawValue) return null;
				
				// Parse OKLCH format manually since browsers don't support it in JS
				if (rawValue.startsWith('oklch(')) {
					const match = rawValue.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
					if (match) {
						const L = parseFloat(match[1]);
						const C = parseFloat(match[2]);
						const H = parseFloat(match[3]);
						
						// Convert OKLCH to RGB (simplified conversion)
						// For white/black (C=0), just use lightness
						if (C === 0) {
							const gray = Math.round(L * 255);
							return { r: gray, g: gray, b: gray };
						}
						
						// Convert to LCH then RGB
						const h_rad = H * Math.PI / 180;
						const a = C * Math.cos(h_rad);
						const b = C * Math.sin(h_rad);
						
						// Simplified OKLab to linear RGB
						const l = L + 0.3963377774 * a + 0.2158037573 * b;
						const m = L - 0.1055613458 * a - 0.0638541728 * b;
						const s = L - 0.0894841775 * a - 1.2914855480 * b;
						
						const l3 = l * l * l;
						const m3 = m * m * m;
						const s3 = s * s * s;
						
						let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
						let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
						let b_val = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
						
						// Clamp and convert to 0-255
						r = Math.max(0, Math.min(1, r));
						g = Math.max(0, Math.min(1, g));
						b_val = Math.max(0, Math.min(1, b_val));
						
						return {
							r: Math.round(r * 255),
							g: Math.round(g * 255),
							b: Math.round(b_val * 255)
						};
					}
				}
				
				// Try standard color parsing for HSL
				try {
					const tempDiv = document.createElement('div');
					tempDiv.style.position = 'fixed';
					tempDiv.style.visibility = 'hidden';
					
					if (rawValue.includes(' ')) {
						// HSL format like "222 47% 11%"
						tempDiv.style.color = `hsl(${rawValue})`;
					} else {
						tempDiv.style.color = rawValue;
					}
					
					document.body.appendChild(tempDiv);
					const computed = getComputedStyle(tempDiv).color;
					document.body.removeChild(tempDiv);
					
					const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
					if (match) {
						return {
							r: parseInt(match[1]),
							g: parseInt(match[2]),
							b: parseInt(match[3])
						};
					}
				} catch (e) {
					// Silent fail
				}
				return null;
			};
			
			const colors = colorVars
				.map(varName => {
					const raw = style.getPropertyValue(varName).trim();
					if (!raw) return null;
					return formatColor(raw);
				})
				.filter(Boolean) as Array<{r: number, g: number, b: number}>;
			
			// Get background color - THIS IS CRITICAL
			const bgRaw = style.getPropertyValue('--background').trim();
			console.log('Background raw:', bgRaw);
			console.log('All CSS vars:', {
				primary: style.getPropertyValue('--primary'),
				secondary: style.getPropertyValue('--secondary'),
				accent: style.getPropertyValue('--accent'),
				background: style.getPropertyValue('--background'),
				foreground: style.getPropertyValue('--foreground')
			});
			
			const background = formatColor(bgRaw);
			console.log('Parsed background RGB:', background);
			console.log('Parsed colors:', colors);
			
			if (!background || colors.length === 0) {
				console.log('FAILED - no background or colors');
				return null;
			}
			
			return { colors, background };
		};

		// Mandelbrot set calculation
		const mandelbrot = (x: number, y: number, maxIter: number): number => {
			let zx = 0, zy = 0;
			let i = 0;
			
			while (zx * zx + zy * zy < 4 && i < maxIter) {
				const temp = zx * zx - zy * zy + x;
				zy = 2 * zx * zy + y;
				zx = temp;
				i++;
			}
			
			if (i === maxIter) return 0;
			// Smooth coloring
			const log_zn = Math.log(zx * zx + zy * zy) / 2;
			const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
			return (i + 1 - nu) / maxIter;
		};

		// Draw fractal visualization
		const drawFractal = (
			ctx: CanvasRenderingContext2D,
			intensity: number,
			colors: Array<{r: number, g: number, b: number}>,
			background: {r: number, g: number, b: number}
		) => {
			const width = canvas.width;
			const height = canvas.height;
			const imageData = ctx.createImageData(width, height);
			const data = imageData.data;
			
			// Adjust zoom and position based on music
			const zoom = zoomRef.current;
			const offsetX = offsetXRef.current;
			const offsetY = offsetYRef.current;
			
			// Lower resolution for performance
			const step = isPlaying ? 2 : 4;
			
			for (let py = 0; py < height; py += step) {
				for (let px = 0; px < width; px += step) {
					let value = 0;
					
					// Map pixel to complex plane
					const x = (px - width / 2) / (width * zoom) + offsetX;
					const y = (py - height / 2) / (height * zoom) + offsetY;
					
					// Only Mandelbrot set
					value = mandelbrot(x, y, 50 + intensity * 50);
					
					// Apply intensity
					value = value * (0.5 + intensity * 0.5);
					
					// Color based on value and theme colors
					let r, g, b;
					if (value > 0.01) {
						// Use theme colors for the fractal
						const colorIndex = Math.floor(value * (colors.length - 1));
						const color1 = colors[Math.min(colorIndex, colors.length - 1)];
						const color2 = colors[Math.min(colorIndex + 1, colors.length - 1)];
						const mix = (value * (colors.length - 1)) % 1;
						
						// Interpolate between theme colors for the fractal
						const fractalR = color1.r * (1 - mix) + color2.r * mix;
						const fractalG = color1.g * (1 - mix) + color2.g * mix;
						const fractalB = color1.b * (1 - mix) + color2.b * mix;
						
						// Mix with background based on value for smooth edges
						r = Math.floor(fractalR * value + background.r * (1 - value));
						g = Math.floor(fractalG * value + background.g * (1 - value));
						b = Math.floor(fractalB * value + background.b * (1 - value));
					} else {
						// Use background color for areas outside the fractal
						r = background.r;
						g = background.g;
						b = background.b;
					}
					
					// Fill pixels (accounting for step size)
					for (let dy = 0; dy < step && py + dy < height; dy++) {
						for (let dx = 0; dx < step && px + dx < width; dx++) {
							const idx = ((py + dy) * width + (px + dx)) * 4;
							data[idx] = r;
							data[idx + 1] = g;
							data[idx + 2] = b;
							data[idx + 3] = 255;
						}
					}
				}
			}
			
			ctx.putImageData(imageData, 0, 0);
		};

		// Animation loop
		const draw = () => {
			animationRef.current = requestAnimationFrame(draw);

			const themeColors = getThemeColors();
			
			// If no theme colors, just clear to match background
			if (!themeColors) {
				// Try to get background color from container
				const container = canvas.closest('.bg-background');
				if (container) {
					const bgColor = getComputedStyle(container).backgroundColor;
					ctx.fillStyle = bgColor || '#ffffff';
				} else {
					ctx.fillStyle = '#ffffff';
				}
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				return;
			}
			
			const { colors, background } = themeColors;
			
			let intensity = 0;
			let bassAvg = 0;
			let midAvg = 0;

			if (analyserRef.current && dataArrayRef.current && isPlaying) {
				// Get frequency data
				analyserRef.current.getByteFrequencyData(dataArrayRef.current);
				
				// Calculate frequency bands
				bassAvg = Array.from(dataArrayRef.current.slice(0, 16))
					.reduce((a, b) => a + b, 0) / (16 * 255);
				midAvg = Array.from(dataArrayRef.current.slice(16, 128))
					.reduce((a, b) => a + b, 0) / (112 * 255);
				
				intensity = (bassAvg + midAvg) / 2;
				
				// Continuous zoom (infinite zoom effect)
				zoomRef.current *= 1 + (bassAvg * 0.01);
				
				// Reset zoom periodically to prevent overflow
				if (zoomRef.current > 100) {
					zoomRef.current = 1;
				}
				
				// Rotation based on mids
				rotationRef.current += midAvg * 0.02;
				
				// Drift based on music
				offsetXRef.current += Math.sin(rotationRef.current) * 0.0001;
				offsetYRef.current += Math.cos(rotationRef.current) * 0.0001;
			} else {
				// Idle animation - very subtle
				intensity = 0.1 + Math.sin(Date.now() * 0.0001) * 0.05;
				zoomRef.current *= 1.0002;
				if (zoomRef.current > 10) {
					zoomRef.current = 1;
				}
				rotationRef.current += 0.001;
			}
			
			drawFractal(ctx, intensity, colors, background);
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
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			window.removeEventListener('resize', handleResize);
		};
	}, []); // Only setup animation once

	return (
		<div className="rounded-xl border shadow-sm h-full relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
			<canvas 
				ref={canvasRef} 
				className="w-full h-full"
				style={{ display: 'block' }}
			/>
		</div>
	);
}