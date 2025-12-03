"use client";

import { motion } from "framer-motion";
import { Tag, Wallet } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { ThemeStripes } from "@/components/market/theme-stripes";

export default function MyThemesPage() {
	const { status, connect, themeTokens } = useYoursWallet();
	const { mode } = useTheme();

	const isConnected = status === "connected";

	if (!isConnected) {
		return (
			<div className="rounded-xl border border-dashed border-border py-20 text-center">
				<Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
				<h3 className="mb-2 text-lg font-semibold">Connect Your Wallet</h3>
				<p className="mb-4 text-muted-foreground">
					Connect to see your theme tokens
				</p>
				<Button onClick={connect}>Connect Wallet</Button>
			</div>
		);
	}

	if (themeTokens.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border py-20 text-center">
				<Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
				<h3 className="mb-2 text-lg font-semibold">No themes found</h3>
				<p className="mb-4 text-muted-foreground">
					You don&apos;t own any theme tokens yet
				</p>
				<Link href="/studio">
					<Button>Inscribe a Theme</Button>
				</Link>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-2xl font-bold">My Theme Tokens</h2>
				<p className="text-muted-foreground">
					Theme tokens you own that can be applied or listed for sale
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{themeTokens.map((theme, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.05 }}
						className="rounded-xl border border-border bg-card p-4"
					>
						<div className="mb-4 flex items-center justify-between">
							<ThemeStripes styles={theme.styles} mode={mode} size="lg" />
							<Badge variant="outline">Owned</Badge>
						</div>
						<h3 className="mb-4 font-semibold">{theme.name}</h3>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" className="flex-1" asChild>
								<Link href="/market/sell">
									<Tag className="mr-2 h-4 w-4" />
									List for Sale
								</Link>
							</Button>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}
