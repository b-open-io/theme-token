"use client";

import { Bold, Italic } from "lucide-react";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { DemoSection } from "./utils";

export function FormsDemo() {
	const [loading, setLoading] = React.useState(true);
	const [progress, setProgress] = React.useState(0);

	React.useEffect(() => {
		let pct = 0;
		setLoading(true);
		setProgress(0);

		const interval = window.setInterval(() => {
			pct = Math.min(100, pct + 12);
			setProgress(pct);
			if (pct >= 100) {
				window.clearInterval(interval);
				setLoading(false);
			}
		}, 120);

		return () => {
			window.clearInterval(interval);
		};
	}, []);

	return (
		<div className="space-y-8">
			<DemoSection title="Form Elements" description="Inputs and controls">
				<div className="grid gap-6 md:grid-cols-2">
					<div className="grid gap-4">
						<div className="space-y-2">
							<Label htmlFor="contact-name">Full Name</Label>
							<Input id="contact-name" placeholder="Alex Johnson" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-email">Email</Label>
							<Input
								id="contact-email"
								type="email"
								placeholder="alex@email.com"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="company">Company / Team</Label>
							<InputGroup className="w-full">
								<InputGroupAddon>
									<InputGroupText>Org</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput
									id="company"
									placeholder="Theme Token Labs"
									className="w-full"
								/>
							</InputGroup>
						</div>
						<div className="space-y-2">
							<Label>Project Category</Label>
							<Select defaultValue="audio">
								<SelectTrigger>
									<SelectValue placeholder="Choose a category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="audio">Audio UI</SelectItem>
									<SelectItem value="design">Design System</SelectItem>
									<SelectItem value="dev">Development</SelectItem>
									<SelectItem value="ops">Ops / Tooling</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid gap-4">
						<div className="space-y-2">
							<Label htmlFor="message">Project Brief</Label>
							<Textarea
								id="message"
								placeholder="Describe your project goals, timeline, and what you need from us."
								className="min-h-[140px]"
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Switch id="notifications" defaultChecked />
							<Label htmlFor="notifications">Notify me about updates</Label>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox id="terms" />
							<Label htmlFor="terms">I agree to the terms</Label>
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

			<DemoSection title="Progress & Loading" description="Feedback indicators">
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Progress ({progress}%)</Label>
						<Progress value={progress} />
					</div>
					<div className="space-y-2">
						<Label>{loading ? "Loading..." : "Loaded Content"}</Label>
						{loading ? (
							<div className="flex items-center space-x-4">
								<Skeleton className="h-12 w-12 rounded-full" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-[200px]" />
									<Skeleton className="h-4 w-[150px]" />
								</div>
							</div>
						) : (
							<div className="flex items-center space-x-4 rounded-lg border p-3">
								<div className="h-12 w-12 rounded-full bg-primary/10" />
								<div className="space-y-1">
									<p className="text-sm font-medium text-foreground">
										Content ready
									</p>
									<p className="text-xs text-muted-foreground">
										This replaces the skeleton once loading completes.
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</DemoSection>
		</div>
	);
}
