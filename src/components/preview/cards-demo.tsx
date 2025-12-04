"use client";

import { AlertCircle, Bell, Heart, MessageSquare, Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DemoSection } from "./utils";

export function CardsDemo() {
	return (
		<div className="space-y-8">
			<DemoSection title="Cards" description="Containers for content">
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

			<DemoSection title="Alerts" description="Important messages">
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
		</div>
	);
}

