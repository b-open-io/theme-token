"use client";

import { Blocks, MessageCircle, ExternalLink } from "lucide-react";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
	EmptyContent,
} from "@/components/ui/empty";
import { useSwatchyStore } from "@/components/swatchy/swatchy-store";

export default function RegistryStudioPage() {
	const { openChat, setPendingMessage } = useSwatchyStore();

	const handleGenerateWithSwatchy = () => {
		setPendingMessage("I want to create a new block component. Can you help me design something?");
		openChat();
	};

	return (
		<StudioDashboard
			sidebar={
				<div className="flex w-80 shrink-0 flex-col border-r border-border bg-background/95 backdrop-blur">
					<ScrollArea className="flex-1">
						<div className="p-4 space-y-6">
							<div>
								<h3 className="text-sm font-medium text-foreground mb-2">
									Component Studio
								</h3>
								<p className="text-xs text-muted-foreground">
									Create shadcn blocks, components, and hooks for on-chain publishing.
								</p>
							</div>

							<div className="space-y-2">
								<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Registry Types
								</h4>
								<ul className="text-xs text-muted-foreground space-y-1">
									<li className="flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-primary" />
										Blocks - Multi-file compositions
									</li>
									<li className="flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-secondary" />
										Components - Single UI elements
									</li>
									<li className="flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-accent" />
										Hooks - React logic
									</li>
									<li className="flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-muted" />
										Libraries - Utility functions
									</li>
								</ul>
							</div>

							<div className="space-y-2">
								<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									CLI Installation
								</h4>
								<code className="block text-xs bg-muted p-2 rounded font-mono break-all">
									bunx shadcn@latest add https://themetoken.dev/r/blocks/&#123;origin&#125;
								</code>
							</div>
						</div>
					</ScrollArea>
				</div>
			}
			bottomLeft={
				<span className="text-xs text-muted-foreground">
					Blocks are theme-aware and use CSS variables
				</span>
			}
			bottomRight={
				<Button size="lg" disabled className="gap-2">
					<Blocks className="h-5 w-5" />
					Inscribe Block
				</Button>
			}
		>
			<div className="flex flex-1 items-center justify-center">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Blocks />
						</EmptyMedia>
						<EmptyTitle>Component Studio</EmptyTitle>
						<EmptyDescription className="max-w-md">
							Create shadcn blocks, components, and hooks that live forever on the blockchain.
							All items are theme-aware and installable via the shadcn CLI.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent className="flex gap-3">
						<Button onClick={handleGenerateWithSwatchy} className="gap-2">
							<MessageCircle className="h-4 w-4" />
							Generate with Swatchy
						</Button>
						<Button variant="outline" asChild>
							<a
								href="https://ui.shadcn.com/docs/registry"
								target="_blank"
								rel="noopener noreferrer"
								className="gap-2"
							>
								<ExternalLink className="h-4 w-4" />
								Registry Docs
							</a>
						</Button>
					</EmptyContent>
				</Empty>
			</div>
		</StudioDashboard>
	);
}
