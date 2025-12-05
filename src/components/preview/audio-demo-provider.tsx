"use client";

import React from "react";
import { $audio, type Track } from "@/lib/audio";
import { useAudioStore } from "@/lib/audio-store";

// Enhanced provider for demo - fixes throttling issues while keeping all functionality
export function AudioDemoProvider({
	tracks = [],
	children,
}: {
	tracks?: Track[];
	children: React.ReactNode;
}) {
	React.useEffect(() => {
		// Initialize audio
		$audio.init();
		
		// Set initial tracks
		if (tracks.length > 0) {
			useAudioStore.setState({
				queue: tracks,
				currentTrack: tracks[0],
				currentQueueIndex: 0,
				isPlaying: false,
				isLoading: false,
				isBuffering: false,
				currentTime: 0,
				duration: tracks[0]?.duration || 0,
				progress: 0,
			});
		}

		const audio = $audio.getAudioElement();
		if (!audio) return;

		// Update without aggressive throttling for smooth progress
		const handleTimeUpdate = () => {
			const currentTime = audio.currentTime;
			const duration = audio.duration || 0;
			const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
			
			// Update immediately for smooth progress bar
			useAudioStore.setState({ 
				currentTime, 
				duration,
				progress 
			});
		};

		const handlePlay = () => {
			useAudioStore.setState({ isPlaying: true, isLoading: false });
		};

		const handlePause = () => {
			useAudioStore.setState({ isPlaying: false });
		};

		const handleLoadStart = () => {
			useAudioStore.setState({ isLoading: true });
		};

		const handleCanPlay = () => {
			useAudioStore.setState({ 
				isLoading: false,
				duration: audio.duration || 0 
			});
		};

		const handleEnded = () => {
			useAudioStore.setState({ isPlaying: false });
			const state = useAudioStore.getState();
			// Move to next track
			if (state.currentQueueIndex < tracks.length - 1) {
				state.handleTrackEnd();
			}
		};

		const handleError = () => {
			useAudioStore.setState({ 
				isPlaying: false, 
				isLoading: false,
				isError: true,
				errorMessage: "Failed to load audio" 
			});
		};

		// Add all event listeners
		audio.addEventListener("timeupdate", handleTimeUpdate);
		audio.addEventListener("play", handlePlay);
		audio.addEventListener("pause", handlePause);
		audio.addEventListener("loadstart", handleLoadStart);
		audio.addEventListener("canplay", handleCanPlay);
		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("error", handleError);

		// Cleanup
		return () => {
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("play", handlePlay);
			audio.removeEventListener("pause", handlePause);
			audio.removeEventListener("loadstart", handleLoadStart);
			audio.removeEventListener("canplay", handleCanPlay);
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("error", handleError);
		};
	}, [tracks]);

	return <>{children}</>;
}