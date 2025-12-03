"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ThemeToken } from "@theme-token/sdk";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface InscribeDialogProps {
	isOpen: boolean;
	onClose: () => void;
	theme: ThemeToken;
	themeName: string;
	profileDisplayName: string | null;
	onConfirm: (data: { name: string; author: string }) => Promise<void>;
	isInscribing: boolean;
	mode: "light" | "dark";
}

export function InscribeDialog({
	isOpen,
	onClose,
	theme,
	themeName,
	profileDisplayName,
	onConfirm,
	isInscribing,
	mode,
}: InscribeDialogProps) {
	const [name, setName] = useState(themeName || theme.name);
	const [author, setAuthor] = useState(profileDisplayName || "Anonymous");
	const authorInputRef = useRef<HTMLInputElement>(null);
	const confirmButtonRef = useRef<HTMLButtonElement>(null);

	// Reset state when dialog opens
	useEffect(() => {
		if (isOpen) {
			setName(themeName || theme.name);
			setAuthor(profileDisplayName || "Anonymous");

			// Auto-focus: If profile exists, focus confirm button; otherwise focus author input
			setTimeout(() => {
				if (profileDisplayName) {
					confirmButtonRef.current?.focus();
				} else {
					authorInputRef.current?.focus();
				}
			}, 100);
		}
	}, [isOpen, theme.name, themeName, profileDisplayName]);

	const handleConfirm = async () => {
		await onConfirm({ name: name.trim() || theme.name, author: author.trim() || "Anonymous" });
	};

	// Extract palette colors from theme
	const styles = theme.styles[mode];
	const paletteColors = [
		styles.background,
		styles.foreground,
		styles.primary,
		styles.secondary || styles.muted,
		styles.accent,
	].filter(Boolean);

	const isAnonymous = author === "Anonymous";

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px] font-mono">
				<DialogHeader>
					<DialogTitle className="tracking-tight">Inscribe Theme</DialogTitle>
					<DialogDescription className="text-xs uppercase tracking-wider">
						Finalize metadata for inscription
					</DialogDescription>
				</DialogHeader>

				{/* Palette Strip Preview */}
				<div className="w-full h-16 rounded-md overflow-hidden flex border border-border my-2">
					{paletteColors.map((color, i) => (
						<div
							key={i}
							style={{ backgroundColor: color }}
							className={`h-full flex-1 ${i === 0 ? "flex-[2]" : ""}`}
						/>
					))}
				</div>

				{/* Metadata Grid */}
				<div className="grid gap-5 py-2">
					{/* Theme Name Input */}
					<div className="grid grid-cols-4 items-center gap-4">
						<Label
							htmlFor="theme-name"
							className="text-right text-xs uppercase text-muted-foreground"
						>
							Token Name
						</Label>
						<input
							id="theme-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={theme.name}
							className="col-span-3 h-9 rounded-lg border border-border bg-muted/50 px-3 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					{/* Author Input */}
					<div className="grid grid-cols-4 items-center gap-4">
						<Label
							htmlFor="theme-author"
							className="text-right text-xs uppercase text-muted-foreground"
						>
							Creator
						</Label>
						<input
							ref={authorInputRef}
							id="theme-author"
							value={author}
							onChange={(e) => setAuthor(e.target.value)}
							placeholder="Your name"
							className={`col-span-3 h-9 rounded-lg border bg-muted/50 px-3 text-sm font-mono focus:outline-none focus:ring-1 ${
								isAnonymous
									? "border-yellow-500/50 text-yellow-500 focus:border-yellow-500 focus:ring-yellow-500/30"
									: "border-border focus:border-primary focus:ring-primary"
							}`}
						/>
					</div>
				</div>

				{/* Anonymous hint */}
				{isAnonymous && (
					<p className="text-xs text-yellow-500/80 text-center">
						Publishing without attribution. Edit above to add your name.
					</p>
				)}

				<DialogFooter className="mt-2">
					<Button
						variant="ghost"
						onClick={onClose}
						disabled={isInscribing}
						className="text-muted-foreground hover:text-foreground"
					>
						Cancel
					</Button>
					<Button
						ref={confirmButtonRef}
						onClick={handleConfirm}
						disabled={!name.trim() || isInscribing}
						className="min-w-[100px]"
					>
						{isInscribing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Inscribing...
							</>
						) : (
							"Inscribe"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
