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
	AudioQueuePreferences,
	AudioQueueRepeatMode,
	AudioQueueShuffle,
} from "@/components/audio/queue";
import { AudioTrackList } from "@/components/audio/track";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
			<div className="grid gap-6 lg:grid-cols-2 items-stretch">
				{/* Left Column - Fixed Height Widgets */}
				<div className="flex flex-col gap-6">
					{/* Widget 1: Compact Now Playing (fully wired to AudioStore) */}
					<Card className="border-0 shadow-md bg-primary text-primary-foreground overflow-hidden relative">
						{/* Background Pattern */}
						<div className="absolute inset-0 opacity-10">
							<div className="absolute right-0 top-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white blur-3xl" />
							<div className="absolute left-0 bottom-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white blur-3xl" />
						</div>
						
						<CardContent className="p-6 relative z-10">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-inner shrink-0">
									<Music className="h-8 w-8 text-white" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-1">
										<Badge variant="secondary" className="bg-white/20 text-white border-0 hover:bg-white/30">
											Now Playing
										</Badge>
										<div className="flex items-center gap-2 text-xs font-medium opacity-80 font-mono">
											<AudioPlayerTimeDisplay className="text-white/80 px-0" />
											<span>/</span>
											<AudioPlayerTimeDisplay remaining className="text-white/80 px-0" />
										</div>
									</div>
									<div className="text-lg font-bold truncate leading-tight">Theme Token Demo</div>
									<div className="text-sm opacity-80 truncate">Compact Player</div>
								</div>
							</div>
							
							<div className="mt-6 space-y-4">
								<AudioPlayer className="border-0 bg-transparent p-0 text-white">
									<AudioPlayerControlBar className="gap-3 items-center">
										<AudioPlayerTimeDisplay className="text-white/80 min-w-[42px]" />
										<AudioPlayerSeekBar className="flex-1 [&_.relative]:h-2 [&_.relative]:bg-white/15 [&_.relative]:rounded-full" />
										<AudioPlayerTimeDisplay remaining className="text-white/80 min-w-[42px]" />
									</AudioPlayerControlBar>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<AudioQueueShuffle className="h-4 w-4 text-white/80 hover:text-white transition-colors" />
											<AudioQueueRepeatMode className="h-4 w-4 text-white/80 hover:text-white transition-colors" />
										</div>
										<div className="flex items-center gap-3">
											<AudioPlayerSkipBack 
												variant="ghost" 
												size="icon" 
												className="h-9 w-9 text-white hover:bg-white/15 [&_svg]:h-5 [&_svg]:w-5" 
											/>
											<AudioPlayerPlay 
												size="icon"
												className="h-11 w-11 rounded-full bg-white text-primary hover:bg-white/90 shadow-lg border-0 [&_svg]:h-6 [&_svg]:w-6 [&_svg]:fill-current [&_svg]:ml-0.5" 
											/>
											<AudioPlayerSkipForward 
												variant="ghost" 
												size="icon" 
												className="h-9 w-9 text-white hover:bg-white/15 [&_svg]:h-5 [&_svg]:w-5" 
											/>
										</div>
										<div className="flex items-center gap-2">
											<AudioPlayerVolume className="hidden sm:flex w-28" />
										</div>
									</div>
								</AudioPlayer>
							</div>
						</CardContent>
					</Card>

					{/* Widget 2: Full Controller */}
					<Card className="shadow-sm">
						<CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
							<div className="text-sm font-medium text-muted-foreground">Playback Controls</div>
							<AudioQueuePreferences />
						</CardHeader>
						<CardContent className="p-4 pt-2">
							<AudioPlayer className="border-0 bg-transparent p-0">
								<AudioPlayerControlBar variant="stacked" className="gap-4">
									<AudioPlayerControlGroup>
										<AudioPlayerTimeDisplay className="min-w-[40px] px-0 text-xs text-muted-foreground font-mono" />
										<AudioPlayerSeekBar className="w-full h-2" />
										<AudioPlayerTimeDisplay remaining className="min-w-[40px] px-0 text-xs text-muted-foreground font-mono" />
									</AudioPlayerControlGroup>
									
									<div className="flex items-center justify-between mt-2">
										<div className="flex items-center gap-2">
											<AudioQueueShuffle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
											<AudioQueueRepeatMode className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
										</div>

										<div className="flex items-center gap-4">
											<AudioPlayerSkipBack 
												variant="ghost" 
												size="icon" 
												className="h-8 w-8 [&_svg]:h-5 [&_svg]:w-5" 
											/>
											<AudioPlayerPlay 
												size="icon"
												className="h-12 w-12 rounded-full border bg-transparent hover:bg-muted [&_svg]:h-6 [&_svg]:w-6 [&_svg]:fill-current [&_svg]:ml-0.5" 
											/>
											<AudioPlayerSkipForward 
												variant="ghost" 
												size="icon" 
												className="h-8 w-8 [&_svg]:h-5 [&_svg]:w-5" 
											/>
										</div>
										
										<div className="flex items-center gap-2">
											<AudioPlayerVolume className="hidden sm:flex w-24" />
										</div>
									</div>
								</AudioPlayerControlBar>
							</AudioPlayer>
						</CardContent>
					</Card>
				</div>

				{/* Right Column - Flexible Playlist */}
				<Card className="flex flex-col overflow-hidden h-full shadow-md border-l-4 border-l-primary">
					<CardHeader className="px-6 py-4 border-b bg-muted/30 shrink-0">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base flex items-center gap-2">
									<ListMusic className="h-4 w-4 text-primary" />
									Up Next
								</CardTitle>
								<CardDescription className="text-xs mt-0.5">
									Queue management
								</CardDescription>
							</div>
							<Badge variant="outline" className="font-mono text-xs bg-background">
								{demoTracks.length} tracks
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="p-0 flex-1 min-h-0">
						<ScrollArea className="h-full">
							<div className="p-0">
								<AudioTrackList 
									sortable 
									showCover 
									className="p-0 divide-y"
								/>
							</div>
						</ScrollArea>
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
