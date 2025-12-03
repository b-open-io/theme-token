"use client";

import { motion } from "framer-motion";
import { Eye, Tag, Type, Wallet } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { loadFontByOrigin, getCachedFont } from "@/lib/font-loader";
import {
	FontFilterSidebar,
} from "@/components/market/font-filter-sidebar";
import {
	DEFAULT_FONT_FILTERS,
	type FontFilterState,
} from "@/lib/font-market";

export default function MyFontsPage() {
	const { status, connect, ownedFonts } = useYoursWallet();
	const [filters, setFilters] = useState<FontFilterState>(DEFAULT_FONT_FILTERS);

	const isConnected = status === "connected";

	// Render content based on state
	const renderContent = () => {
		if (!isConnected) {
			return (
				<div className="rounded-xl border border-dashed border-border py-20 text-center">
					<Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
					<h3 className="mb-2 text-lg font-semibold">Connect Your Wallet</h3>
					<p className="mb-4 text-muted-foreground">
						Connect to see your font tokens
					</p>
					<Button onClick={connect}>Connect Wallet</Button>
				</div>
			);
		}

		if (ownedFonts.length === 0) {
			return (
				<div className="rounded-xl border border-dashed border-border py-20 text-center">
					<Type className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
					<h3 className="mb-2 text-lg font-semibold">No fonts found</h3>
					<p className="mb-4 text-muted-foreground">
						You don&apos;t own any font tokens yet
					</p>
					<Link href="/studio/font">
						<Button>Create a Font</Button>
					</Link>
				</div>
			);
		}

		return (
			<>
				<div className="mb-6">
					<h2 className="text-xl font-semibold">My Font Tokens</h2>
					<p className="text-sm text-muted-foreground">
						Font tokens you own that can be used in themes or listed for sale
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{ownedFonts.map((owned, i) => (
						<OwnedFontCard key={owned.outpoint} font={owned} index={i} />
					))}
				</div>
			</>
		);
	};

	return (
		<div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
			{/* Sidebar - Desktop */}
			<aside className="hidden lg:block lg:col-span-3 xl:col-span-2">
				<div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
					<FontFilterSidebar
						filters={filters}
						onFiltersChange={setFilters}
						maxPrice={10}
					/>
				</div>
			</aside>

			{/* Main Content */}
			<main className="lg:col-span-9 xl:col-span-10">{renderContent()}</main>
		</div>
	);
}

function OwnedFontCard({
	font,
	index,
}: {
	font: {
		outpoint: string;
		origin: string;
		metadata: {
			name: string;
			author?: string;
			license?: string;
			weight?: string;
			style?: string;
			aiGenerated?: boolean;
			glyphCount?: number;
		};
	};
	index: number;
}) {
	const [fontFamily, setFontFamily] = useState<string>("inherit");
	const [isLoading, setIsLoading] = useState(false);

	// Load font preview
	const loadFont = useCallback(async () => {
		if (fontFamily !== "inherit" || isLoading) return;

		const cached = getCachedFont(font.origin);
		if (cached) {
			setFontFamily(cached.familyName);
			return;
		}

		setIsLoading(true);
		try {
			const family = await loadFontByOrigin(font.origin);
			setFontFamily(family);
		} catch (err) {
			console.error("[OwnedFontCard] Failed to load font:", err);
		} finally {
			setIsLoading(false);
		}
	}, [font.origin, fontFamily, isLoading]);

	// Load font on mount
	useEffect(() => {
		loadFont();
	}, [loadFont]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
			className="rounded-xl border border-border bg-card p-4"
		>
			{/* Font Preview */}
			<div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-muted/30">
				<div
					className="text-4xl"
					style={{ fontFamily: fontFamily !== "inherit" ? fontFamily : "inherit" }}
				>
					{isLoading ? (
						<span className="text-muted-foreground text-sm">Loading...</span>
					) : (
						"Aa"
					)}
				</div>
			</div>

			{/* Metadata */}
			<div className="mb-3 flex items-center justify-between">
				<h3 className="font-semibold">{font.metadata.name}</h3>
				<Badge variant="outline">Owned</Badge>
			</div>
			<p className="mb-1 text-xs text-muted-foreground">
				{font.metadata.author || "Unknown"} &middot;{" "}
				<span className="font-mono">{font.origin.slice(0, 8)}</span>
			</p>
			<div className="mb-4 flex flex-wrap gap-1">
				{font.metadata.weight && font.metadata.weight !== "400" && (
					<Badge variant="secondary" className="text-[10px]">
						w{font.metadata.weight}
					</Badge>
				)}
				{font.metadata.style && font.metadata.style !== "normal" && (
					<Badge variant="secondary" className="text-[10px]">
						{font.metadata.style}
					</Badge>
				)}
				{font.metadata.aiGenerated && (
					<Badge variant="secondary" className="text-[10px]">
						AI
					</Badge>
				)}
				{font.metadata.license && (
					<Badge variant="outline" className="text-[10px]">
						{font.metadata.license}
					</Badge>
				)}
			</div>

			{/* Actions */}
			<div className="flex gap-2">
				<Button variant="outline" size="sm" className="flex-1" asChild>
					<Link href={`/preview/font/${font.origin}`}>
						<Eye className="mr-2 h-4 w-4" />
						Preview
					</Link>
				</Button>
				<Button variant="outline" size="sm" className="flex-1" asChild>
					<Link href="/market/sell">
						<Tag className="mr-2 h-4 w-4" />
						Sell
					</Link>
				</Button>
			</div>
		</motion.div>
	);
}
