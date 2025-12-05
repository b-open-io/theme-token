"use client";

import { AnimatedThemeStripes } from "./animated-theme-stripes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	ArrowLeft,
	AudioWaveform,
	Bot,
	Check,
	CreditCard,
	Grid3X3,
	LayoutDashboard,
	Music,
	Palette,
	Play,
	SkipBack,
	SkipForward,
	Sparkles,
	Sun,
	Type,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function DashboardDemo() {
	return (
		<div className="space-y-6">
			<AnimatedThemeStripes />
			
			<div className="space-y-6">
				{/* Desktop Mockup - Full Width */}
				<div className="overflow-hidden flex flex-col shadow-2xl rounded-xl border bg-background">
					{/* Mock Browser Chrome */}
					<div className="h-10 flex items-center px-4 gap-3 select-none border-b bg-muted/40">
						<div className="flex gap-1.5">
							<div className="w-3 h-3 rounded-full bg-destructive/60" />
							<div className="w-3 h-3 rounded-full bg-primary/60" />
							<div className="w-3 h-3 rounded-full bg-accent/60" />
						</div>
						<div className="ml-2 flex-1 max-w-sm px-3 py-1 text-xs flex items-center gap-2 rounded-md bg-background border text-muted-foreground">
							<div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center">
								<div className="w-1.5 h-1.5 rounded-full bg-primary" />
							</div>
							<span className="opacity-70">app.yourproject.com</span>
						</div>
					</div>

					{/* Dashboard Content */}
					<div className="flex min-h-[450px]">
						{/* Sidebar */}
						<div className="w-52 hidden lg:flex flex-col border-r bg-card/50 p-4 gap-4">
							<div className="flex items-center gap-2 px-2">
								<div className="h-6 w-6 rounded-md bg-primary" />
								<span className="font-bold text-sm">Acme Inc</span>
							</div>
							<div className="space-y-1">
								<Button variant="secondary" size="sm" className="w-full justify-start">
									<LayoutDashboard className="mr-2 h-4 w-4" />
									Dashboard
								</Button>
								<Button variant="ghost" size="sm" className="w-full justify-start">
									<CreditCard className="mr-2 h-4 w-4" />
									Transactions
								</Button>
								<Button variant="ghost" size="sm" className="w-full justify-start">
									<Grid3X3 className="mr-2 h-4 w-4" />
									Integrations
								</Button>
								<Button variant="ghost" size="sm" className="w-full justify-start">
									<Palette className="mr-2 h-4 w-4" />
									Appearance
								</Button>
							</div>
						</div>

						{/* Main Area */}
						<div className="flex-1 flex flex-col bg-muted/10">
							{/* Header */}
							<div className="h-12 border-b bg-background px-4 flex items-center justify-between">
								<h2 className="font-semibold text-sm">Dashboard</h2>
								<div className="flex items-center gap-2">
									<Button variant="outline" size="sm" className="h-7 text-xs">Feedback</Button>
									<Avatar className="h-7 w-7">
										<AvatarImage src="https://github.com/shadcn.png" />
										<AvatarFallback>CN</AvatarFallback>
									</Avatar>
								</div>
							</div>

							<ScrollArea className="flex-1">
								<div className="p-4 space-y-4">
									{/* Stats */}
									<div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
										<Card className="p-0">
											<CardHeader className="p-3 pb-1">
												<CardTitle className="text-xs font-medium text-muted-foreground">Total Revenue</CardTitle>
											</CardHeader>
											<CardContent className="p-3 pt-0">
												<div className="text-xl font-bold">$12,345</div>
												<p className="text-[10px] text-emerald-500 font-medium">+12.5% from last month</p>
											</CardContent>
										</Card>
										<Card className="p-0">
											<CardHeader className="p-3 pb-1">
												<CardTitle className="text-xs font-medium text-muted-foreground">Active Users</CardTitle>
											</CardHeader>
											<CardContent className="p-3 pt-0">
												<div className="text-xl font-bold">+2,350</div>
												<p className="text-[10px] text-emerald-500 font-medium">+18.2% from last week</p>
											</CardContent>
										</Card>
										<Card className="p-0 hidden lg:block">
											<CardHeader className="p-3 pb-1">
												<CardTitle className="text-xs font-medium text-muted-foreground">Sales</CardTitle>
											</CardHeader>
											<CardContent className="p-3 pt-0">
												<div className="text-xl font-bold">+1,203</div>
												<p className="text-[10px] text-emerald-500 font-medium">+4.5% from yesterday</p>
											</CardContent>
										</Card>
									</div>

									{/* Chart + Recent */}
									<div className="grid gap-3 lg:grid-cols-5">
										<Card className="lg:col-span-3 p-0">
											<CardHeader className="p-3">
												<CardTitle className="text-sm">Overview</CardTitle>
											</CardHeader>
											<CardContent className="p-3 pt-0">
												<div className="h-[140px] w-full bg-muted/20 rounded-md flex items-end gap-1.5 p-3">
													{[40, 30, 50, 80, 60, 90, 70, 45, 65].map((h, i) => (
														<div key={i} className="flex-1 bg-primary/80 hover:bg-primary rounded-t-sm transition-all" style={{ height: `${h}%` }} />
													))}
												</div>
											</CardContent>
										</Card>
										<Card className="lg:col-span-2 p-0">
											<CardHeader className="p-3">
												<CardTitle className="text-sm">Recent Sales</CardTitle>
											</CardHeader>
											<CardContent className="p-3 pt-0">
												<div className="space-y-3">
													{[1, 2, 3].map((i) => (
														<div key={i} className="flex items-center gap-2">
															<Avatar className="h-7 w-7">
																<AvatarImage src={`https://avatar.vercel.sh/${i}.png`} />
																<AvatarFallback>OM</AvatarFallback>
															</Avatar>
															<div className="flex-1 min-w-0">
																<p className="text-xs font-medium truncate">Olivia Martin</p>
																<p className="text-[10px] text-muted-foreground truncate">olivia@email.com</p>
															</div>
															<div className="text-xs font-bold">+$1,999</div>
														</div>
													))}
												</div>
											</CardContent>
										</Card>
									</div>
								</div>
							</ScrollArea>
						</div>
					</div>
				</div>

				{/* Mosaic Layout: Phone + Widgets */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
					{/* Phone Mockup - Compact & Left Aligned */}
					<div className="lg:col-span-4 xl:col-span-3 flex justify-center lg:justify-start">
						<div className="relative w-[260px] rounded-[2.5rem] border-[8px] border-foreground/80 bg-background shadow-xl overflow-hidden">
							{/* Notch */}
							<div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground/80 rounded-b-2xl z-20" />
							
							{/* Screen Content */}
							<div className="flex flex-col h-[500px] bg-background">
								{/* Status Bar */}
								<div className="h-10 flex items-center justify-between px-5 pt-2 select-none">
									<span className="text-[10px] font-semibold">9:41</span>
									<div className="flex gap-1">
										<div className="h-2 w-2 rounded-full bg-foreground" />
										<div className="h-2 w-2 rounded-full bg-foreground" />
									</div>
								</div>

								{/* App Header */}
								<div className="px-4 py-2 flex items-center justify-between">
									<div>
										<span className="text-[10px] text-muted-foreground">Good morning,</span>
										<div className="text-lg font-bold">Alex</div>
									</div>
									<Avatar className="h-8 w-8">
										<AvatarImage src="https://github.com/shadcn.png" />
										<AvatarFallback>AL</AvatarFallback>
									</Avatar>
								</div>

								{/* Body */}
								<ScrollArea className="flex-1 px-4">
									<div className="space-y-4 py-2">
										{/* Balance Card */}
										<div className="rounded-xl bg-primary p-4 text-primary-foreground shadow-lg relative overflow-hidden">
											<div className="absolute top-0 right-0 p-2 opacity-10">
												<CreditCard className="w-16 h-16" />
											</div>
											<div className="relative z-10">
												<div className="text-[10px] opacity-80 mb-0.5">Total Balance</div>
												<div className="text-2xl font-bold mb-2">$14,235</div>
												<Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">+2.5%</Badge>
											</div>
										</div>

										{/* Quick Actions */}
										<div className="flex justify-between gap-2">
											{["Send", "Receive", "More"].map((label, i) => (
												<div key={i} className="flex flex-col items-center gap-1">
													<Button variant="outline" size="icon" className="h-11 w-11 rounded-xl">
														<ArrowLeft className={`h-4 w-4 ${i === 1 ? "rotate-180" : i === 2 ? "hidden" : ""}`} />
														{i === 2 && <Grid3X3 className="h-4 w-4" />}
													</Button>
													<span className="text-[10px] font-medium">{label}</span>
												</div>
											))}
										</div>

										{/* List */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<span className="font-semibold text-xs">Transactions</span>
												<Button variant="link" size="sm" className="h-auto p-0 text-[10px]">See All</Button>
											</div>
											{[1, 2].map(i => (
												<Card key={i} className="p-2 flex items-center gap-2">
													<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
														<div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
													</div>
													<div className="flex-1 min-w-0">
														<div className="text-xs font-medium truncate">Dribbble Pro</div>
														<div className="text-xs text-muted-foreground">Subscription</div>
													</div>
													<div className="text-xs font-bold">-$12</div>
												</Card>
											))}
										</div>
									</div>
								</ScrollArea>
								
								{/* Bottom Nav */}
								<div className="h-14 border-t bg-background flex items-center justify-around px-2">
									<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-primary bg-primary/10">
										<LayoutDashboard className="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground">
										<CreditCard className="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground">
										<Bot className="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground">
										<Type className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					</div>

					{/* Widgets Grid - Tetris Layout */}
					<div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
						{/* Top: Music Player */}
						<Card className="p-4 relative overflow-hidden shadow-md w-full">
							<div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
								<AudioWaveform className="w-32 h-32" />
							</div>
							<div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
								<div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 ring-1 ring-border/50">
									<Music className="h-8 w-8" />
								</div>
								<div className="flex-1 min-w-0 text-center sm:text-left">
									<div className="flex items-center justify-center sm:justify-between mb-1">
										<div className="text-base font-semibold truncate">Theme Token Beat</div>
										<Badge variant="outline" className="hidden sm:flex text-[10px] font-mono">NOW PLAYING</Badge>
									</div>
									<div className="text-sm text-muted-foreground truncate mb-3">Lo-Fi Study Mix</div>
									{/* Progress Bar */}
									<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
										<div className="h-full bg-primary w-1/3 rounded-full" />
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Button variant="ghost" size="icon" className="h-10 w-10">
										<SkipBack className="h-5 w-5" />
									</Button>
									<Button size="icon" className="h-12 w-12 rounded-full shadow-lg hover:scale-105 transition-transform">
										<Play className="h-5 w-5 fill-current ml-0.5" />
									</Button>
									<Button variant="ghost" size="icon" className="h-10 w-10">
										<SkipForward className="h-5 w-5" />
									</Button>
								</div>
							</div>
						</Card>

						{/* Middle: Watch & Status & Controls */}
						<div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
							{/* Watch Mockup - Spans 2 Rows */}
							<Card className="md:row-span-2 h-full flex justify-center items-center p-6 relative overflow-hidden shadow-md border">
								<div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent pointer-events-none" />
								<div className="relative w-[140px] h-[170px] rounded-[2rem] border-[6px] border-foreground/80 bg-background shadow-2xl overflow-hidden shrink-0 transform transition-transform hover:scale-105 duration-500">
									<div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
										<div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
										<div className="text-3xl font-bold tracking-tighter relative z-10">10:09</div>
										<div className="text-[10px] text-primary font-medium uppercase tracking-widest mt-1 relative z-10">Tue 12</div>
										<div className="mt-3 flex gap-1.5 relative z-10">
											<div className="w-6 h-6 rounded-full border-[3px] border-primary/30 border-t-primary" />
											<div className="w-6 h-6 rounded-full border-[3px] border-accent/30 border-t-accent" />
											<div className="w-6 h-6 rounded-full border-[3px] border-secondary/30 border-t-secondary" />
										</div>
									</div>
								</div>
							</Card>

							{/* Status Cards */}
							<Card className="p-4 flex flex-row items-center gap-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
									<Check className="w-5 h-5" />
								</div>
								<div>
									<div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">System Status</div>
									<div className="text-lg font-bold">Operational</div>
								</div>
							</Card>
							
							{/* Control Card 1 */}
							<Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
								<div className="flex items-center justify-between mb-3">
									<div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
										<Sun className="h-4 w-4" />
									</div>
									<Switch checked id="light-switch" />
								</div>
								<div className="font-bold text-sm">Smart Lighting</div>
								<div className="text-xs text-muted-foreground mt-1">75% Brightness</div>
							</Card>

							{/* AI Status */}
							<Card className="p-4 flex flex-row items-center gap-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-accent">
								<div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent-foreground shrink-0">
									<Bot className="w-5 h-5" />
								</div>
								<div>
									<div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">AI Model</div>
									<div className="text-lg font-bold">Ready v2.4</div>
								</div>
							</Card>

							{/* Control Card 2 */}
							<Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
								<div className="flex items-center justify-between mb-3">
									<div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
										<Sparkles className="h-4 w-4" />
									</div>
									<Switch id="ambiance-switch" />
								</div>
								<div className="font-bold text-sm">Ambiance</div>
								<div className="text-xs text-muted-foreground mt-1">Relax Mode</div>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}