"use client";

import { useState } from "react";
import { ColorPaletteSection } from "@/components/color-palette-section";
import {
	Activity,
	AlertCircle,
	ArrowDownRight,
	ArrowUpRight,
	Bell,
	ChevronRight,
	CreditCard,
	DollarSign,
	Download,
	Mail,
	MessageSquare,
	Minus,
	MoreHorizontal,
	Plus,
	Search,
	Settings,
	Terminal,
	TrendingUp,
	User,
	Users,
} from "lucide-react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	XAxis,
	YAxis,
} from "recharts";
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
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Chart data
const revenueData = [
	{ month: "Jan", revenue: 4000, expenses: 2400 },
	{ month: "Feb", revenue: 3000, expenses: 1398 },
	{ month: "Mar", revenue: 9800, expenses: 2000 },
	{ month: "Apr", revenue: 3908, expenses: 2780 },
	{ month: "May", revenue: 4800, expenses: 1890 },
	{ month: "Jun", revenue: 3800, expenses: 2390 },
];

const activityData = [
	{ day: "Mon", desktop: 186, mobile: 80 },
	{ day: "Tue", desktop: 305, mobile: 200 },
	{ day: "Wed", desktop: 237, mobile: 120 },
	{ day: "Thu", desktop: 73, mobile: 190 },
	{ day: "Fri", desktop: 209, mobile: 130 },
	{ day: "Sat", desktop: 214, mobile: 140 },
	{ day: "Sun", desktop: 186, mobile: 80 },
];

const exerciseData = [
	{ day: "Mon", minutes: 30 },
	{ day: "Tue", minutes: 45 },
	{ day: "Wed", minutes: 60 },
	{ day: "Thu", minutes: 35 },
	{ day: "Fri", minutes: 50 },
	{ day: "Sat", minutes: 75 },
	{ day: "Sun", minutes: 40 },
];

const revenueConfig = {
	revenue: {
		label: "Revenue",
		color: "var(--chart-1)",
	},
	expenses: {
		label: "Expenses",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

const activityConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
	mobile: {
		label: "Mobile",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

const exerciseConfig = {
	minutes: {
		label: "Minutes",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

// Revenue Line Chart
function RevenueChart() {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Total Revenue</CardTitle>
				<div className="flex items-baseline gap-2">
					<span className="text-3xl font-bold">$15,231.89</span>
					<span className="text-sm text-muted-foreground">
						+20.1% from last month
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer config={revenueConfig} className="h-[200px] w-full">
					<LineChart
						data={revenueData}
						margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							className="stroke-muted"
						/>
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<ChartTooltip content={<ChartTooltipContent />} />
						<Line
							type="monotone"
							dataKey="revenue"
							stroke="var(--color-revenue)"
							strokeWidth={2}
							dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 4 }}
							activeDot={{ r: 6 }}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

// Activity Bar Chart
function ActivityChart() {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Weekly Activity</CardTitle>
				<CardDescription>Desktop vs Mobile visitors</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={activityConfig} className="h-[200px] w-full">
					<BarChart
						data={activityData}
						margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							className="stroke-muted"
						/>
						<XAxis
							dataKey="day"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<ChartTooltip content={<ChartTooltipContent />} />
						<Bar
							dataKey="desktop"
							fill="var(--color-desktop)"
							radius={[4, 4, 0, 0]}
						/>
						<Bar
							dataKey="mobile"
							fill="var(--color-mobile)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

// Exercise Area Chart
function ExerciseChart() {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Exercise Minutes</CardTitle>
				<CardDescription>
					Your exercise minutes are ahead of where you normally are.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={exerciseConfig} className="h-[200px] w-full">
					<AreaChart
						data={exerciseData}
						margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							className="stroke-muted"
						/>
						<XAxis
							dataKey="day"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<ChartTooltip content={<ChartTooltipContent />} />
						<defs>
							<linearGradient id="fillMinutes" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-minutes)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-minutes)"
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<Area
							type="monotone"
							dataKey="minutes"
							stroke="var(--color-minutes)"
							fill="url(#fillMinutes)"
							strokeWidth={2}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}

// Calendar Card (like tweakcn)
function CalendarCard() {
	const today = new Date();
	const currentMonth = today.toLocaleString("default", {
		month: "long",
		year: "numeric",
	});
	const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

	// Generate calendar days
	const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
	const daysInMonth = new Date(
		today.getFullYear(),
		today.getMonth() + 1,
		0,
	).getDate();
	const calendarDays: (number | null)[] = [];

	for (let i = 0; i < firstDay; i++) calendarDays.push(null);
	for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

	const highlightedDays = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
	const todayDate = today.getDate();

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base">{currentMonth}</CardTitle>
					<div className="flex gap-1">
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<ChevronRight className="h-4 w-4 rotate-180" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-7 gap-1 text-center text-xs">
					{days.map((day) => (
						<div key={day} className="p-2 text-muted-foreground font-medium">
							{day}
						</div>
					))}
					{calendarDays.map((day, i) => (
						<div
							key={i}
							className={`p-2 rounded-md text-sm ${
								day === null
									? ""
									: day === todayDate
										? "bg-primary text-primary-foreground font-bold"
										: highlightedDays.includes(day)
											? "bg-primary/20 text-primary font-medium"
											: "hover:bg-muted cursor-pointer"
							}`}
						>
							{day}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

// Move Goal Card (like tweakcn)
function MoveGoalCard() {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Move Goal</CardTitle>
				<CardDescription>Set your daily activity goal.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center gap-4">
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						size="icon"
						className="h-10 w-10 rounded-full"
					>
						<Minus className="h-4 w-4" />
					</Button>
					<div className="text-center">
						<div className="text-5xl font-bold">350</div>
						<div className="text-xs text-muted-foreground uppercase tracking-wider">
							Calories/day
						</div>
					</div>
					<Button
						variant="outline"
						size="icon"
						className="h-10 w-10 rounded-full"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex gap-1 w-full">
					{[40, 60, 80, 100, 70, 90, 50].map((h, i) => (
						<div
							key={i}
							className="flex-1 rounded bg-primary"
							style={{ height: `${h}px` }}
						/>
					))}
				</div>
				<Button variant="secondary" className="w-full">
					Set Goal
				</Button>
			</CardContent>
		</Card>
	);
}

// Stats Card Block
function StatsCards() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
					<DollarSign className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">$45,231.89</div>
					<p className="text-xs text-muted-foreground">
						<span className="text-green-500 inline-flex items-center">
							<ArrowUpRight className="h-3 w-3 mr-1" />
							+20.1%
						</span>{" "}
						from last month
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">+2,350</div>
					<p className="text-xs text-muted-foreground">
						<span className="text-green-500 inline-flex items-center">
							<ArrowUpRight className="h-3 w-3 mr-1" />
							+180.1%
						</span>{" "}
						from last month
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Sales</CardTitle>
					<CreditCard className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">+12,234</div>
					<p className="text-xs text-muted-foreground">
						<span className="text-green-500 inline-flex items-center">
							<ArrowUpRight className="h-3 w-3 mr-1" />
							+19%
						</span>{" "}
						from last month
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Active Now</CardTitle>
					<Activity className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">+573</div>
					<p className="text-xs text-muted-foreground">
						<span className="text-red-500 inline-flex items-center">
							<ArrowDownRight className="h-3 w-3 mr-1" />
							-201
						</span>{" "}
						since last hour
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

// Recent Activity Table
function RecentActivity() {
	const activities = [
		{ id: "INV001", status: "Paid", method: "Credit Card", amount: "$250.00" },
		{ id: "INV002", status: "Pending", method: "PayPal", amount: "$150.00" },
		{
			id: "INV003",
			status: "Unpaid",
			method: "Bank Transfer",
			amount: "$350.00",
		},
		{ id: "INV004", status: "Paid", method: "Credit Card", amount: "$450.00" },
		{ id: "INV005", status: "Paid", method: "PayPal", amount: "$550.00" },
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Transactions</CardTitle>
				<CardDescription>Your recent payment activity</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Invoice</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Method</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{activities.map((activity) => (
							<TableRow key={activity.id}>
								<TableCell className="font-medium">{activity.id}</TableCell>
								<TableCell>
									<Badge
										variant={
											activity.status === "Paid"
												? "default"
												: activity.status === "Pending"
													? "secondary"
													: "destructive"
										}
									>
										{activity.status}
									</Badge>
								</TableCell>
								<TableCell>{activity.method}</TableCell>
								<TableCell className="text-right">{activity.amount}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

// Form Block
function FormDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Create Account</CardTitle>
				<CardDescription>Enter your details to get started</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="firstName">First Name</Label>
						<Input id="firstName" placeholder="John" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="lastName">Last Name</Label>
						<Input id="lastName" placeholder="Doe" />
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input id="email" type="email" placeholder="john@example.com" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="bio">Bio</Label>
					<Textarea id="bio" placeholder="Tell us about yourself..." />
				</div>
				<div className="space-y-2">
					<Label>Plan</Label>
					<Select defaultValue="pro">
						<SelectTrigger>
							<SelectValue placeholder="Select a plan" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="free">Free</SelectItem>
							<SelectItem value="pro">Pro - $9/month</SelectItem>
							<SelectItem value="enterprise">Enterprise - $49/month</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox id="terms" />
					<Label htmlFor="terms" className="text-sm">
						I agree to the terms and conditions
					</Label>
				</div>
			</CardContent>
			<CardFooter>
				<Button className="w-full">Create Account</Button>
			</CardFooter>
		</Card>
	);
}

// Notifications Card
function NotificationsCard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Notifications</CardTitle>
				<CardDescription>
					Configure how you receive notifications
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Mail className="h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">Email Notifications</p>
							<p className="text-xs text-muted-foreground">
								Receive emails about activity
							</p>
						</div>
					</div>
					<Switch defaultChecked />
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Bell className="h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">Push Notifications</p>
							<p className="text-xs text-muted-foreground">
								Receive push notifications
							</p>
						</div>
					</div>
					<Switch />
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<MessageSquare className="h-4 w-4 text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">SMS Notifications</p>
							<p className="text-xs text-muted-foreground">
								Receive SMS for important alerts
							</p>
						</div>
					</div>
					<Switch />
				</div>
			</CardContent>
		</Card>
	);
}

// Team Members Card
function TeamMembers() {
	const members = [
		{ name: "Sofia Davis", email: "sofia@example.com", role: "Owner" },
		{ name: "Jackson Lee", email: "jackson@example.com", role: "Member" },
		{ name: "Isabella Nguyen", email: "isabella@example.com", role: "Member" },
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Team Members</CardTitle>
				<CardDescription>Invite and manage team members</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{members.map((member, i) => (
					<div key={i} className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Avatar className="h-9 w-9">
								<AvatarImage src={`https://avatar.vercel.sh/${member.email}`} />
								<AvatarFallback>
									{member.name
										.split(" ")
										.map((n) => n[0])
										.join("")}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="text-sm font-medium">{member.name}</p>
								<p className="text-xs text-muted-foreground">{member.email}</p>
							</div>
						</div>
						<Badge variant={member.role === "Owner" ? "default" : "secondary"}>
							{member.role}
						</Badge>
					</div>
				))}
			</CardContent>
			<CardFooter>
				<Button variant="outline" className="w-full">
					<Plus className="mr-2 h-4 w-4" />
					Invite Member
				</Button>
			</CardFooter>
		</Card>
	);
}

// Buttons Showcase
function ButtonsShowcase() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Buttons</CardTitle>
				<CardDescription>All button variants and sizes</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<Button>Primary</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="outline">Outline</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="link">Link</Button>
					<Button variant="destructive">Destructive</Button>
				</div>
				<Separator />
				<div className="flex flex-wrap gap-2">
					<Button size="lg">Large</Button>
					<Button size="default">Default</Button>
					<Button size="sm">Small</Button>
					<Button size="icon">
						<Settings className="h-4 w-4" />
					</Button>
				</div>
				<Separator />
				<div className="flex flex-wrap gap-2">
					<Button disabled>Disabled</Button>
					<Button>
						<Download className="mr-2 h-4 w-4" />
						With Icon
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// Alerts Showcase
function AlertsShowcase() {
	return (
		<div className="space-y-4">
			<Alert>
				<Terminal className="h-4 w-4" />
				<AlertTitle>Heads up!</AlertTitle>
				<AlertDescription>
					You can add components to your app using the cli.
				</AlertDescription>
			</Alert>
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>
					Your session has expired. Please log in again.
				</AlertDescription>
			</Alert>
		</div>
	);
}

// Progress & Sliders
function ProgressDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Progress & Controls</CardTitle>
				<CardDescription>Interactive controls preview</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Storage Used</span>
						<span className="text-muted-foreground">75%</span>
					</div>
					<Progress value={75} />
				</div>
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Volume</span>
						<span className="text-muted-foreground">50%</span>
					</div>
					<Slider defaultValue={[50]} max={100} step={1} />
				</div>
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Brightness</span>
						<span className="text-muted-foreground">80%</span>
					</div>
					<Slider defaultValue={[80]} max={100} step={1} />
				</div>
			</CardContent>
		</Card>
	);
}

// Tabs Demo
function TabsDemo() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Account Settings</CardTitle>
				<CardDescription>Manage your account preferences</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="account">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="account">Account</TabsTrigger>
						<TabsTrigger value="password">Password</TabsTrigger>
						<TabsTrigger value="settings">Settings</TabsTrigger>
					</TabsList>
					<TabsContent value="account" className="space-y-4 pt-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input id="name" defaultValue="John Doe" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input id="username" defaultValue="@johndoe" />
						</div>
					</TabsContent>
					<TabsContent value="password" className="space-y-4 pt-4">
						<div className="space-y-2">
							<Label htmlFor="current">Current Password</Label>
							<Input id="current" type="password" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="new">New Password</Label>
							<Input id="new" type="password" />
						</div>
					</TabsContent>
					<TabsContent value="settings" className="space-y-4 pt-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="marketing">Marketing emails</Label>
							<Switch id="marketing" />
						</div>
						<div className="flex items-center justify-between">
							<Label htmlFor="social">Social notifications</Label>
							<Switch id="social" defaultChecked />
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}

interface ThemeColors {
	[key: string]: string | undefined;
}

interface ThemePreviewPanelProps {
	onUpdateColor?: (key: string, value: string) => void;
	primaryColor?: string;
	themeColors?: ThemeColors;
}

// Main Preview Panel
export function ThemePreviewPanel({ onUpdateColor, primaryColor, themeColors }: ThemePreviewPanelProps) {
	return (
		<div className="@container min-h-full w-full p-2 md:p-4 **:data-[slot=card]:shadow-none">
			<div className="flex flex-col gap-4">
				{/* Color Section - Palette Generator + Theme Colors side by side */}
				<ColorPaletteSection onUpdateColor={onUpdateColor} primaryColor={primaryColor} themeColors={themeColors} />

				{/* Stats */}
				<StatsCards />

				{/* Charts Row - like tweakcn */}
				<div className="grid gap-4 @2xl:grid-cols-3">
					<RevenueChart />
					<CalendarCard />
					<MoveGoalCard />
				</div>

				{/* More Charts */}
				<div className="grid gap-4 @xl:grid-cols-2">
					<ActivityChart />
					<ExerciseChart />
				</div>

				{/* Two Column Layout */}
				<div className="grid gap-4 @xl:grid-cols-2">
					<FormDemo />
					<div className="flex flex-col gap-4">
						<NotificationsCard />
						<TeamMembers />
					</div>
				</div>

				{/* Buttons & Alerts */}
				<div className="grid gap-4 @xl:grid-cols-2">
					<ButtonsShowcase />
					<div className="flex flex-col gap-4">
						<AlertsShowcase />
						<ProgressDemo />
					</div>
				</div>

				{/* Table */}
				<RecentActivity />

				{/* Tabs */}
				<TabsDemo />
			</div>
		</div>
	);
}
