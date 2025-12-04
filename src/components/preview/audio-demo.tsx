"use client";

import {
	AudioPlayer,
	AudioPlayerControlBar,
	AudioPlayerControlGroup,
	AudioPlayerPlay,
	AudioPlayerSeekBar,
	AudioPlayerSkipBack,
	AudioPlayerSkipForward,
	AudioPlayerTimeDisplay,
	AudioPlayerVolume,
} from "@/components/audio/player";
import { AudioProvider } from "@/components/audio/provider";
import {
	AudioQueue,
	AudioQueuePreferences,
	AudioQueueRepeatMode,
	AudioQueueShuffle,
} from "@/components/audio/queue";
import { AudioTrackList } from "@/components/audio/track";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { AudioWaveform, ListMusic, Music, Volume2 } from "lucide-react";
import * as React from "react";
import { DemoSection } from "./utils";

const demoTracks = [
	{
		id: "track-1",
		title: "Theme Token Demo",
		artist: "Theme Token",
		url: "https://cdn.pixabay.com/audio/2024/10/21/audio_78251ef8e3.mp3",
		duration: 180,
	},
	{
		id: "track-2",
		title: "Neon Nights",
		artist: "Synthwave Collective",
		url: "https://cdn.pixabay.com/audio/2022/10/05/audio_6861212515.mp3",
		duration: 245,
	},
	{
		id: "track-3",
		title: "Digital Horizon",
		artist: "Future Beats",
		url: "https://cdn.pixabay.com/audio/2023/09/06/audio_1089d81372.mp3",
		duration: 162,
	},
	{
		id: "track-4",
		title: "Cybernetic Dreams",
		artist: "AI Audio",
		url: "https://cdn.pixabay.com/audio/2022/03/24/audio_14567786.mp3",
		duration: 210,
	},
];

function AudioPlayerDemo() {
	return (
		<AudioProvider tracks={demoTracks}>
			<div className="grid gap-4 md:grid-cols-2">
				{/* Main Player Card */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/60">
								<Music className="h-5 w-5 text-primary-foreground" />
							</div>
							<div>
								<CardTitle className="text-base">Now Playing</CardTitle>
								<CardDescription>Theme Token Demo</CardDescription>
							</div>
						</div>
						<AudioQueuePreferences />
					</CardHeader>
					<CardContent>
						<AudioPlayer className="border-0 bg-transparent p-0">
							<AudioPlayerControlBar variant="stacked" className="gap-4">
								<AudioPlayerControlGroup>
									<AudioPlayerTimeDisplay className="min-w-[40px] px-0 text-xs text-muted-foreground" />
									<AudioPlayerSeekBar className="w-full" />
									<AudioPlayerTimeDisplay remaining className="min-w-[40px] px-0 text-xs text-muted-foreground" />
								</AudioPlayerControlGroup>
								
								<AudioPlayerControlGroup className="justify-between">
									<div className="flex items-center gap-2">
										<AudioQueueShuffle />
										<AudioQueueRepeatMode />
									</div>

									<div className="flex items-center gap-2">
										<AudioPlayerSkipBack className="h-8 w-8" />
										<AudioPlayerPlay className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" />
										<AudioPlayerSkipForward className="h-8 w-8" />
									</div>
									
									<div className="flex items-center gap-2">
										<AudioPlayerVolume className="hidden sm:flex" />
										<AudioQueue />
									</div>
								</AudioPlayerControlGroup>
							</AudioPlayerControlBar>
						</AudioPlayer>
					</CardContent>
				</Card>

				{/* Playlist Card */}
				<Card className="flex flex-col gap-0 p-0 overflow-hidden">
					<CardHeader className="px-6 py-4 border-b bg-muted/5">
						<div className="flex items-center justify-between">
							<CardTitle className="text-base flex items-center gap-2">
								<ListMusic className="h-4 w-4" />
								Up Next
							</CardTitle>
							<Badge variant="secondary" className="font-mono text-xs">
								{demoTracks.length} tracks
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<AudioTrackList 
							sortable 
							showCover 
							className="max-h-[300px] p-0"
						/>
					</CardContent>
				</Card>
			</div>
		</AudioProvider>
	);
}

function WaveformDemo() {
	const bars = 40;
	const [heights] = React.useState(() =>
		Array.from({ length: bars }, () => Math.random() * 100),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base flex items-center gap-2">
					<AudioWaveform className="h-4 w-4" />
					Waveform Visualizer
				</CardTitle>
				<CardDescription>
					Audio visualization with theme colors
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex h-24 items-end justify-between gap-0.5">
					{heights.map((height, i) => (
						<div
							key={String(i)}
							className="w-full rounded-t-sm bg-primary/20 transition-all hover:bg-primary/40"
							style={{ height: `${height}%` }}
						/>
					))}
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="secondary">0:00</Badge>
					<Progress value={33} className="flex-1" />
					<Badge variant="secondary">3:24</Badge>
				</div>
			</CardContent>
		</Card>
	);
}

function VolumeControlsDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base flex items-center gap-2">
					<Volume2 className="h-4 w-4" />
					Volume Controls
				</CardTitle>
				<CardDescription>
					Standalone volume and playback controls
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label>Master Volume</Label>
					<div className="flex items-center gap-3">
						<Volume2 className="h-4 w-4 text-muted-foreground" />
						<Slider
							defaultValue={[75]}
							max={100}
							step={1}
							className="flex-1"
						/>
						<span className="w-12 text-right text-sm text-muted-foreground">
							75%
						</span>
					</div>
				</div>

				<Separator />

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Checkbox id="mono" />
						<Label htmlFor="mono" className="text-sm font-normal">
							Mono audio
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox id="normalize" defaultChecked />
						<Label htmlFor="normalize" className="text-sm font-normal">
							Normalize volume
						</Label>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function AudioDemo() {
	return (
		<div className="space-y-8">
			<DemoSection title="Audio Player" description="Complete media player with queue management">
				<AudioPlayerDemo />
			</DemoSection>

			<DemoSection title="Audio Components" description="Supporting audio UI elements">
				<div className="grid gap-4 md:grid-cols-2">
					<WaveformDemo />
					<VolumeControlsDemo />
				</div>
			</DemoSection>
		</div>
	);
}
