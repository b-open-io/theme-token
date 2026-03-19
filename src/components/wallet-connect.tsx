"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Check,
	ChevronDown,
	Loader2,
	Moon,
	Sun,
	Wallet,
	X,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";

// Color stripes thumbnail for themes
function ThemeStripes({
	styles,
	mode,
}: {
	styles: { light: Record<string, string>; dark: Record<string, string> };
	mode: "light" | "dark";
}) {
	const colors = [
		styles[mode].primary,
		styles[mode].secondary,
		styles[mode].accent,
		styles[mode].background,
	];

	return (
		<div className="flex h-4 w-4 overflow-hidden rounded-sm border border-border">
			{colors.map((color, i) => (
				<div key={i} className="flex-1" style={{ backgroundColor: color }} />
			))}
		</div>
	);
}

function ModeToggle() {
	const { mode, toggleMode } = useTheme();

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={(e) => toggleMode(e)}
			className="h-9 w-9"
			title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
		>
			{mode === "light" ? (
				<Moon className="h-4 w-4" />
			) : (
				<Sun className="h-4 w-4" />
			)}
		</Button>
	);
}

export function WalletConnect() {
	const { status, error, connect, disconnect, themeTokens, isLoading } =
		useYoursWallet();
	const { activeTheme, applyThemeAnimated, resetTheme, mode } = useTheme();
	const [isOpen, setIsOpen] = useState(false);

	// Not installed / disconnected / error — show connect button
	if (status === "not-installed" || status === "disconnected" || status === "error") {
		return (
			<div className="flex items-center gap-1">
				<ModeToggle />
				<Button
					variant="ghost"
					size="sm"
					onClick={() => connect()}
					className="gap-1.5"
					title="Connect wallet"
				>
					<Wallet className="h-4 w-4" fill="currentColor" />
					<span className="hidden sm:inline">Connect</span>
				</Button>
				{error && <span className="text-xs text-destructive">{error}</span>}
			</div>
		);
	}

	// Connecting state
	if (status === "connecting") {
		return (
			<div className="flex items-center gap-1">
				<ModeToggle />
				<Button variant="ghost" size="sm" disabled className="gap-1.5">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span className="hidden sm:inline">Connecting...</span>
				</Button>
			</div>
		);
	}

	// Connected state
	return (
		<div className="flex items-center gap-1">
			<ModeToggle />

			{/* Theme Selector Dropdown */}
			<div className="relative">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setIsOpen(!isOpen)}
					className="gap-1.5"
				>
					{activeTheme ? (
						<ThemeStripes styles={activeTheme.styles} mode={mode} />
					) : (
						<div className="flex h-4 w-4 items-center justify-center rounded-sm border border-dashed border-muted-foreground">
							<span className="text-[8px] text-muted-foreground">?</span>
						</div>
					)}
					<span className="hidden max-w-[120px] truncate sm:inline">
						{activeTheme?.name ?? "Select Theme"}
					</span>
					{isLoading ? (
						<Loader2 className="h-3 w-3 animate-spin" />
					) : (
						<ChevronDown
							className={`h-3 w-3 transition-transform ${
								isOpen ? "rotate-180" : ""
							}`}
						/>
					)}
				</Button>

				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.15 }}
							className="absolute right-0 top-full z-[100] mt-2 min-w-[200px] max-w-[240px] rounded-lg border border-border bg-card p-2 shadow-lg"
						>
							{/* Theme List */}
							{themeTokens.length === 0 ? (
								<div className="px-2 py-3 text-center text-sm text-muted-foreground">
									{isLoading ? (
										<div className="flex items-center justify-center gap-2">
											<Loader2 className="h-4 w-4 animate-spin" />
											Loading...
										</div>
									) : (
										<>
											<p className="text-xs">No Theme Tokens found</p>
											<p className="mt-1 text-xs opacity-60">
												Inscribe one to see it here
											</p>
										</>
									)}
								</div>
							) : (
								<div className="max-h-64 space-y-1 overflow-auto">
									{themeTokens.map((token) => (
										<button
											key={token.name}
											onClick={(e) => {
												applyThemeAnimated(token, e);
												setIsOpen(false);
											}}
											className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
												activeTheme?.name === token.name
													? "bg-primary/10 text-primary"
													: "hover:bg-muted"
											}`}
										>
											<ThemeStripes styles={token.styles} mode={mode} />
											<span className="flex-1 truncate">{token.name}</span>
											{activeTheme?.name === token.name && (
												<Check className="h-4 w-4" />
											)}
										</button>
									))}
								</div>
							)}

							{/* Actions */}
							<div className="mt-2 border-t border-border pt-2">
								{activeTheme && (
									<button
										onClick={() => {
											resetTheme();
											setIsOpen(false);
										}}
										className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									>
										<X className="h-4 w-4" />
										Reset to default
									</button>
								)}
								<button
									onClick={() => {
										disconnect();
										setIsOpen(false);
									}}
									className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<Wallet className="h-4 w-4" fill="currentColor" />
									Disconnect wallet
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
