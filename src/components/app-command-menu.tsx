"use client";

import {
	ImageIcon,
	LayoutGrid,
	Moon,
	Palette,
	Search,
	Shapes,
	Sparkles,
	Sun,
	Type,
} from "lucide-react";
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

const destinations = [
	{ href: "/themes", label: "Browse themes", icon: LayoutGrid },
	{ href: "/studio/theme", label: "Theme Studio", icon: Palette },
	{ href: "/studio/font", label: "Font Studio", icon: Type },
	{ href: "/studio/patterns", label: "Pattern Studio", icon: Shapes },
	{ href: "/studio/wallpaper", label: "Wallpaper Studio", icon: ImageIcon },
	{ href: "/studio/icon", label: "Icon Studio", icon: Sparkles },
];

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
				className="size-8 gap-2 px-0 lg:h-8 lg:w-auto lg:px-3"
				onClick={() => setOpen(true)}
				size="sm"
				variant="ghost"
			>
				<Search data-icon="inline-start" />
				<span className="hidden lg:inline">Search</span>
				<kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline">
					⌘K
				</kbd>
			</Button>

			{open && (
				<CommandDialog onOpenChange={setOpen} open>
					<CommandInput placeholder="Search pages and studios…" />
					<CommandList>
						<CommandEmpty>No matching destination.</CommandEmpty>
						<CommandGroup heading="Navigate">
							{destinations.map(({ href, label, icon: Icon }) => (
								<CommandItem
									key={href}
									onSelect={() => navigate(href)}
									value={label}
								>
									<Icon />
									{label}
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
