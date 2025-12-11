"use client";

import { Shapes } from "lucide-react";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
} from "@/components/ui/empty";

export default function IconStudioPage() {
	return (
		<StudioDashboard
			sidebar={
				<div className="flex w-80 shrink-0 flex-col border-r border-border bg-background/95 backdrop-blur">
					<ScrollArea className="flex-1">
						<div className="p-4">
							<h3 className="text-sm font-medium text-muted-foreground mb-4">
								Icon Settings
							</h3>
							<p className="text-xs text-muted-foreground">
								Configure icon generation options here.
							</p>
						</div>
					</ScrollArea>
				</div>
			}
			bottomLeft={
				<span className="text-xs text-muted-foreground">Coming soon</span>
			}
			bottomRight={
				<Button size="lg" disabled className="gap-2">
					<Shapes className="h-5 w-5" />
					Inscribe Icon
				</Button>
			}
		>
			<div className="flex flex-1 items-center justify-center">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Shapes />
						</EmptyMedia>
						<EmptyTitle>Icon Studio</EmptyTitle>
						<EmptyDescription>
							Create custom icons for your themes. Coming soon!
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		</StudioDashboard>
	);
}
