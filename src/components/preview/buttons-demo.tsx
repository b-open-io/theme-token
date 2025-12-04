"use client";

import { Mail, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoSection } from "./utils";

export function ButtonsDemo() {
	return (
		<div className="space-y-8">
			<DemoSection title="Buttons" description="Interactive button styles">
				<div className="space-y-4">
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
				</div>
			</DemoSection>

			<DemoSection title="Badges" description="Status indicators and labels">
				<div className="flex flex-wrap gap-2">
					<Badge>Default</Badge>
					<Badge variant="secondary">Secondary</Badge>
					<Badge variant="destructive">Destructive</Badge>
					<Badge variant="outline">Outline</Badge>
				</div>
			</DemoSection>
		</div>
	);
}

