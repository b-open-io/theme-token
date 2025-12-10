"use client";

import {
	AlertCircle,
	Bell,
	Bold,
	Check,
	ChevronRight,
	Heart,
	Italic,
	Mail,
	MessageSquare,
	Pause,
	Play,
	Settings,
	SkipBack,
	SkipForward,
	Star,
	User,
	Volume2,
	VolumeX,
} from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";

// Color swatch component
function ColorSwatch({ name, cssVar }: { name: string; cssVar: string }) {
	return (
		<div className="flex items-center gap-3">
			<div
				className="h-10 w-10 rounded-md border shadow-sm"
				style={{ backgroundColor: `var(--${cssVar})` }}
			/>
			<div>
				<p className="text-sm font-medium">{name}</p>
				<p className="font-mono text-xs text-muted-foreground">--{cssVar}</p>
			</div>
		</div>
	);
}

// Section wrapper
function DemoSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">{title}</h3>
			{children}
		</div>
	);
}

// Audio Player Demo Component
function AudioPlayerDemo() {
	const [isPlaying, setIsPlaying] = React.useState(false);
	const [isMuted, setIsMuted] = React.useState(false);
	const [volume, setVolume] = React.useState([70]);
	const [currentTime, setCurrentTime] = React.useState([0]);
	const [duration, setDuration] = React.useState(180); // 3 minutes demo

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<Card>
			<CardContent className="p-6">
				{/* Track Info */}
				<div className="mb-6 flex items-start gap-4">
					<div className="h-16 w-16 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							className="h-8 w-8 text-primary-foreground"
						>
							<path d="M9 18V5l12-2v13M9 13c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-1c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
						</svg>
					</div>
					<div className="flex-1">
						<h4 className="font-semibold">Demo Audio Track</h4>
						<p className="text-sm text-muted-foreground">Theme Token Demo</p>
					</div>
				</div>

				{/* Seek Bar */}
				<div className="mb-2 space-y-2">
					<Slider
						value={currentTime}
						onValueChange={setCurrentTime}
						max={duration}
						step={1}
						className="w-full"
					/>
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>{formatTime(currentTime[0])}</span>
						<span>{formatTime(duration)}</span>
					</div>
				</div>

				{/* Controls */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9"
							onClick={() => setCurrentTime([Math.max(0, currentTime[0] - 10)])}
						>
							<SkipBack className="h-4 w-4" />
						</Button>
						<Button
							variant="default"
							size="icon"
							className="h-11 w-11 rounded-full"
							onClick={() => setIsPlaying(!isPlaying)}
						>
							{isPlaying ? (
								<Pause className="h-5 w-5" />
							) : (
								<Play className="h-5 w-5 ml-0.5" />
							)}
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9"
							onClick={() =>
								setCurrentTime([Math.min(duration, currentTime[0] + 10)])
							}
						>
							<SkipForward className="h-4 w-4" />
						</Button>
					</div>

					{/* Volume Control */}
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9"
							onClick={() => setIsMuted(!isMuted)}
						>
							{isMuted ? (
								<VolumeX className="h-4 w-4" />
							) : (
								<Volume2 className="h-4 w-4" />
							)}
						</Button>
						<div className="w-24">
							<Slider
								value={isMuted ? [0] : volume}
								onValueChange={(v) => {
									setVolume(v);
									if (v[0] > 0) setIsMuted(false);
								}}
								max={100}
								step={1}
							/>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Waveform Visualizer Demo
function WaveformDemo() {
	const bars = 40;
	const [heights] = React.useState(
		Array.from({ length: bars }, () => Math.random() * 100),
	);

	return (
		<Card>
			<CardContent className="p-6">
				<div className="mb-4">
					<h4 className="mb-1 font-semibold">Waveform Visualizer</h4>
					<p className="text-sm text-muted-foreground">
						Audio visualization with theme colors
					</p>
				</div>
				<div className="flex h-32 items-end justify-between gap-0.5">
					{heights.map((height, i) => (
						<div
							key={i}
							className="w-full rounded-t-sm bg-primary/20 transition-all hover:bg-primary/40"
							style={{ height: `${height}%` }}
						/>
					))}
				</div>
				<div className="mt-4 flex items-center justify-center gap-2">
					<Badge variant="secondary">0:00</Badge>
					<Progress value={33} className="w-full" />
					<Badge variant="secondary">3:24</Badge>
				</div>
			</CardContent>
		</Card>
	);
}

export function ThemeDemo() {
	return (
		<div className="space-y-12">
			{/* Color Palette */}
			<DemoSection title="Color Palette">
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
					<ColorSwatch name="Background" cssVar="background" />
					<ColorSwatch name="Foreground" cssVar="foreground" />
					<ColorSwatch name="Primary" cssVar="primary" />
					<ColorSwatch name="Primary FG" cssVar="primary-foreground" />
					<ColorSwatch name="Secondary" cssVar="secondary" />
					<ColorSwatch name="Secondary FG" cssVar="secondary-foreground" />
					<ColorSwatch name="Muted" cssVar="muted" />
					<ColorSwatch name="Muted FG" cssVar="muted-foreground" />
					<ColorSwatch name="Accent" cssVar="accent" />
					<ColorSwatch name="Accent FG" cssVar="accent-foreground" />
					<ColorSwatch name="Destructive" cssVar="destructive" />
					<ColorSwatch name="Border" cssVar="border" />
					<ColorSwatch name="Ring" cssVar="ring" />
					<ColorSwatch name="Card" cssVar="card" />
				</div>
			</DemoSection>

			<Separator />

			{/* Typography */}
			<DemoSection title="Typography">
				<div className="space-y-4">
					<div>
						<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
							Heading 1
						</h1>
					</div>
					<div>
						<h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
							Heading 2
						</h2>
					</div>
					<div>
						<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
							Heading 3
						</h3>
					</div>
					<div>
						<h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
							Heading 4
						</h4>
					</div>
					<p className="leading-7">
						This is a paragraph of body text. Theme tokens enable designers and
						developers to create, share, and sell UI themes as blockchain
						assets.
					</p>
					<p className="text-sm text-muted-foreground">
						This is muted secondary text, often used for descriptions and helper
						text.
					</p>
					<p className="text-sm font-medium leading-none">
						Small bold label text
					</p>
					<code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
						Inline code example
					</code>
				</div>
			</DemoSection>

			<Separator />

			{/* Buttons */}
			<DemoSection title="Buttons">
				<div className="flex flex-wrap gap-3">
					<Button>Default</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="destructive">Destructive</Button>
					<Button variant="outline">Outline</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="link">Link</Button>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button size="sm">Small</Button>
					<Button size="default">Default</Button>
					<Button size="lg">Large</Button>
					<Button size="icon">
						<Settings className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button disabled>Disabled</Button>
					<Button>
						<Mail className="mr-2 h-4 w-4" /> With Icon
					</Button>
				</div>
			</DemoSection>

			<Separator />

			{/* Badges */}
			<DemoSection title="Badges">
				<div className="flex flex-wrap gap-2">
					<Badge>Default</Badge>
					<Badge variant="secondary">Secondary</Badge>
					<Badge variant="destructive">Destructive</Badge>
					<Badge variant="outline">Outline</Badge>
				</div>
			</DemoSection>

			<Separator />

			{/* Alerts */}
			<DemoSection title="Alerts">
				<div className="space-y-3">
					<Alert>
						<Bell className="h-4 w-4" />
						<AlertTitle>Default Alert</AlertTitle>
						<AlertDescription>
							This is a default alert message for general information.
						</AlertDescription>
					</Alert>
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>
							Something went wrong. Please try again.
						</AlertDescription>
					</Alert>
				</div>
			</DemoSection>

			<Separator />

			{/* Cards */}
			<DemoSection title="Cards">
				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Card Title</CardTitle>
							<CardDescription>
								Card description with muted text.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p>
								Card content goes here. This demonstrates how cards look with
								your theme.
							</p>
						</CardContent>
						<CardFooter className="flex justify-between">
							<Button variant="ghost">Cancel</Button>
							<Button>Save</Button>
						</CardFooter>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center gap-4">
							<Avatar>
								<AvatarImage src="https://github.com/shadcn.png" />
								<AvatarFallback>CN</AvatarFallback>
							</Avatar>
							<div>
								<CardTitle className="text-base">User Profile</CardTitle>
								<CardDescription>@username</CardDescription>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex gap-4 text-sm">
								<div className="flex items-center gap-1">
									<Heart className="h-4 w-4 text-muted-foreground" />
									<span>1.2k</span>
								</div>
								<div className="flex items-center gap-1">
									<MessageSquare className="h-4 w-4 text-muted-foreground" />
									<span>89</span>
								</div>
								<div className="flex items-center gap-1">
									<Star className="h-4 w-4 text-muted-foreground" />
									<span>4.9</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</DemoSection>

			<Separator />

			{/* Form Elements */}
			<DemoSection title="Form Elements">
				<div className="grid gap-6 md:grid-cols-2">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" type="email" placeholder="name@example.com" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="message">Message</Label>
							<Textarea id="message" placeholder="Type your message..." />
						</div>
						<div className="space-y-2">
							<Label>Select Option</Label>
							<Select>
								<SelectTrigger>
									<SelectValue placeholder="Select..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="option1">Option 1</SelectItem>
									<SelectItem value="option2">Option 2</SelectItem>
									<SelectItem value="option3">Option 3</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center space-x-2">
							<Switch id="notifications" />
							<Label htmlFor="notifications">Enable notifications</Label>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox id="terms" />
							<Label htmlFor="terms">Accept terms and conditions</Label>
						</div>
						<div className="space-y-2">
							<Label>Volume</Label>
							<Slider defaultValue={[50]} max={100} step={1} />
						</div>
						<div className="flex gap-2">
							<Toggle aria-label="Bold">
								<Bold className="h-4 w-4" />
							</Toggle>
							<Toggle aria-label="Italic">
								<Italic className="h-4 w-4" />
							</Toggle>
						</div>
					</div>
				</div>
			</DemoSection>

			<Separator />

			{/* Progress & Skeleton */}
			<DemoSection title="Progress & Loading">
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Progress (66%)</Label>
						<Progress value={66} />
					</div>
					<div className="space-y-2">
						<Label>Skeleton Loading</Label>
						<div className="flex items-center space-x-4">
							<Skeleton className="h-12 w-12 rounded-full" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-[200px]" />
								<Skeleton className="h-4 w-[150px]" />
							</div>
						</div>
					</div>
				</div>
			</DemoSection>

			<Separator />

			{/* Tabs */}
			<DemoSection title="Tabs">
				<Tabs defaultValue="account" className="w-full">
					<TabsList>
						<TabsTrigger value="account">
							<User className="mr-2 h-4 w-4" />
							Account
						</TabsTrigger>
						<TabsTrigger value="settings">
							<Settings className="mr-2 h-4 w-4" />
							Settings
						</TabsTrigger>
						<TabsTrigger value="notifications">
							<Bell className="mr-2 h-4 w-4" />
							Notifications
						</TabsTrigger>
					</TabsList>
					<TabsContent value="account" className="mt-4">
						<Card>
							<CardHeader>
								<CardTitle>Account</CardTitle>
								<CardDescription>
									Make changes to your account settings here.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2">
								<div className="space-y-1">
									<Label htmlFor="name">Name</Label>
									<Input id="name" defaultValue="John Doe" />
								</div>
							</CardContent>
							<CardFooter>
								<Button>Save changes</Button>
							</CardFooter>
						</Card>
					</TabsContent>
					<TabsContent value="settings" className="mt-4">
						<Card>
							<CardHeader>
								<CardTitle>Settings</CardTitle>
								<CardDescription>Configure your preferences.</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center space-x-2">
									<Switch id="dark-mode" />
									<Label htmlFor="dark-mode">Dark mode</Label>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="notifications" className="mt-4">
						<Card>
							<CardHeader>
								<CardTitle>Notifications</CardTitle>
								<CardDescription>
									Manage notification preferences.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center space-x-2">
									<Checkbox id="email-notif" defaultChecked />
									<Label htmlFor="email-notif">Email notifications</Label>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</DemoSection>

			<Separator />

			{/* Interactive List */}
			<DemoSection title="Interactive List">
				<Card>
					<CardContent className="p-0">
						{[
							{ name: "Account Settings", icon: User },
							{ name: "Notifications", icon: Bell },
							{ name: "Messages", icon: MessageSquare },
							{ name: "Preferences", icon: Settings },
						].map((item, i) => (
							<button
								key={item.name}
								className={`flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted ${
									i !== 3 ? "border-b" : ""
								}`}
							>
								<div className="flex items-center gap-3">
									<item.icon className="h-5 w-5 text-muted-foreground" />
									<span>{item.name}</span>
								</div>
								<ChevronRight className="h-5 w-5 text-muted-foreground" />
							</button>
						))}
					</CardContent>
				</Card>
			</DemoSection>

			<Separator />

			{/* Status Indicators */}
			<DemoSection title="Status Indicators">
				<div className="flex flex-wrap gap-4">
					<div className="flex items-center gap-2">
						<span className="relative flex h-3 w-3">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-3 opacity-75"></span>
							<span className="relative inline-flex h-3 w-3 rounded-full bg-chart-3"></span>
						</span>
						<span className="text-sm">Online</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="h-3 w-3 rounded-full bg-chart-4"></span>
						<span className="text-sm">Away</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="h-3 w-3 rounded-full bg-destructive"></span>
						<span className="text-sm">Busy</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="h-3 w-3 rounded-full bg-muted-foreground"></span>
						<span className="text-sm">Offline</span>
					</div>
				</div>
			</DemoSection>

			<Separator />

			{/* Success State */}
			<DemoSection title="Success State">
				<Card className="border-chart-3/50 bg-chart-3/10">
					<CardContent className="flex items-center gap-4 p-6">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-3">
							<Check className="h-6 w-6 text-primary-foreground" />
						</div>
						<div>
							<h4 className="font-semibold text-chart-3">
								Payment Successful
							</h4>
							<p className="text-sm text-chart-3/80">
								Your transaction has been completed.
							</p>
						</div>
					</CardContent>
				</Card>
			</DemoSection>

			<Separator />

			{/* Audio Components */}
			<DemoSection title="Audio Components">
				<div className="space-y-4">
					<AudioPlayerDemo />
					<WaveformDemo />

					{/* Volume Controls */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Volume Controls</CardTitle>
							<CardDescription>
								Standalone volume and playback controls
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
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

							<div className="space-y-2">
								<Label>Bass</Label>
								<div className="flex items-center gap-3">
									<span className="text-xs text-muted-foreground">−</span>
									<Slider
										defaultValue={[50]}
										max={100}
										step={1}
										className="flex-1"
									/>
									<span className="text-xs text-muted-foreground">+</span>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Treble</Label>
								<div className="flex items-center gap-3">
									<span className="text-xs text-muted-foreground">−</span>
									<Slider
										defaultValue={[50]}
										max={100}
										step={1}
										className="flex-1"
									/>
									<span className="text-xs text-muted-foreground">+</span>
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

					{/* Playlist Controls */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Playlist</CardTitle>
							<CardDescription>
								Queue management and track selection
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{[
									{ name: "Track One", duration: "3:24", active: true },
									{ name: "Track Two", duration: "4:12", active: false },
									{ name: "Track Three", duration: "2:58", active: false },
								].map((track, i) => (
									<button
										key={i}
										className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors ${
											track.active
												? "bg-primary text-primary-foreground"
												: "hover:bg-muted"
										}`}
									>
										<div className="flex items-center gap-3">
											<div
												className={`flex h-8 w-8 items-center justify-center rounded ${
													track.active ? "bg-primary-foreground/20" : "bg-muted"
												}`}
											>
												{track.active ? (
													<Pause className="h-4 w-4" />
												) : (
													<Play className="h-4 w-4 ml-0.5" />
												)}
											</div>
											<div>
												<p className="text-sm font-medium">{track.name}</p>
												<p
													className={`text-xs ${
														track.active
															? "text-primary-foreground/70"
															: "text-muted-foreground"
													}`}
												>
													Theme Token Demo
												</p>
											</div>
										</div>
										<span
											className={`text-sm ${
												track.active
													? "text-primary-foreground/80"
													: "text-muted-foreground"
											}`}
										>
											{track.duration}
										</span>
									</button>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</DemoSection>
		</div>
	);
}
