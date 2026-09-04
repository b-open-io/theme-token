"use client";

import { LayoutGrid, Moon, Search, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "@/components/ui/command";
import { useFeatureFlags } from "@/lib/feature-flags";
import { getStudioTabs } from "@/lib/routes";

function isTypingTarget(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable ||
			["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
	);
}

export function AppCommandMenu() {
	const router = useRouter();
	const { mode, toggleMode } = useTheme();
	const flags = useFeatureFlags();
	const studioTabs = getStudioTabs(flags);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (isTypingTarget(event.target)) return;

			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((current) => !current);
				return;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	const navigate = (href: string) => {
		setOpen(false);
		router.push(href);
	};

	return (
		<>
			<Button
				aria-label="Open command menu"
				className="size-8 gap-1.5 px-0 text-muted-foreground hover:text-foreground lg:h-8 lg:w-auto lg:px-2"
				onClick={() => setOpen(true)}
				size="sm"
				variant="ghost"
			>
				<Search data-icon="inline-start" />
				<kbd className="hidden rounded border border-border/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline">
					⌘K
				</kbd>
			</Button>

			{open && (
				<CommandDialog onOpenChange={setOpen} open>
					<CommandInput placeholder="Search pages and studios…" />
					<CommandList>
						<CommandEmpty>No matching destination.</CommandEmpty>
						<CommandGroup heading="Navigate">
							<CommandItem
								onSelect={() => navigate("/themes")}
								value="Browse themes"
							>
								<LayoutGrid />
								Browse themes
							</CommandItem>
							{studioTabs.map(({ path, label, icon: Icon }) => (
								<CommandItem
									key={path}
									onSelect={() => navigate(path)}
									value={`${label} Studio`}
								>
									{Icon && <Icon />}
									{label} Studio
								</CommandItem>
							))}
						</CommandGroup>
						<CommandGroup heading="Appearance">
							<CommandItem
								onSelect={() => {
									setOpen(false);
									void toggleMode();
								}}
							>
								{mode === "dark" ? <Sun /> : <Moon />}
								Use {mode === "dark" ? "light" : "dark"} mode
								<CommandShortcut>D</CommandShortcut>
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</CommandDialog>
			)}
		</>
	);
}
