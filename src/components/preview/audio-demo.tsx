"use client";

import React from "react";
import ParticlePlayerWidget from "@/components/audio/particles/particle-player-widget";
import { AudioDemoProvider } from "./audio-demo-provider";
import { AudioVisualizerFractal } from "./audio-visualizer-fractal";
import { useAudioStore } from "@/lib/audio-store";
import { DemoSection } from "./utils";

const demoTracks = [
	{
		id: "tt-theme",
		title: "Theme Token Theme",
		artist: "Satchmo",
		url: "/sounds/theme-token-theme.mp3",
		artwork: "/sounds/theme-token-theme.jpg",
		duration: 320,
	},
	{
		id: "world-alchema",
		title: "World of Alchema",
		artist: "Satchmo",
		url: "/sounds/world-of-alchema.mp3",
		artwork: "/sounds/world-of-alchema.jpg",
		duration: 204,
	},
	{
		id: "kings-watch",
		title: "King's Watch",
		artist: "Satchmo",
		url: "/sounds/kings-watch.mp3",
		artwork: "/sounds/kings-watch.jpg",
		duration: 199,
	},
	{
		id: "cerro-sombras",
		title: "Cerro Sombras",
		artist: "Satchmo",
		url: "/sounds/cerro-sombras.mp3",
		artwork: "/sounds/cerro-sombras.jpg",
		duration: 220,
	},
];


export function AudioDemo() {
	// Pause audio when component unmounts (tab switch)
	React.useEffect(() => {
		return () => {
			// Pause audio when leaving the tab
			const state = useAudioStore.getState();
			if (state.isPlaying) {
				state.pause();
			}
		};
	}, []);

	return (
		<AudioDemoProvider tracks={demoTracks}>
			<div className="relative overflow-hidden rounded-xl" style={{ height: 'calc(100vh - 24rem)' }}>
				{/* Fullscreen visualizer */}
				<AudioVisualizerFractal />
				
				{/* Player overlay at bottom center */}
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-10">
					<ParticlePlayerWidget />
				</div>
			</div>
		</AudioDemoProvider>
	);
}
