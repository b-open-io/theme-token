"use client";

import { Bold, Italic } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { DemoSection } from "./utils";

export function FormsDemo() {
	return (
		<div className="space-y-8">
			<DemoSection title="Form Elements" description="Inputs and controls">
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

			<DemoSection title="Progress & Loading" description="Feedback indicators">
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
		</div>
	);
}

