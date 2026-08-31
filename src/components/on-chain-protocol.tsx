"use client";

import { motion } from "framer-motion";
import { FileCode, Image, Palette, Type } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "@/components/code-block";

type AssetType = "theme" | "font" | "pattern" | "wallpaper";

const EXAMPLES: Record<
	AssetType,
	{ icon: typeof Palette; label: string; json: string }
> = {
	theme: {
		icon: FileCode,
		label: "Theme",
		json: `{
  "app": "theme-token",
  "type": "registry:style",
  "name": "Cyberpunk Neon",
  "version": "1.0.0",
  "description": "A bright cyberpunk theme"
}`,
	},
	font: {
		icon: Type,
		label: "Font",
		json: `{
  "app": "theme-token",
  "type": "theme-token:asset",
  "kind": "font",
  "mediaType": "font/woff2",
  "name": "Elegant Serif",
  "version": "1.0.0",
  "description": "An elegant serif typeface",
  "author": "John Doe",
  "license": "OFL"
}`,
	},
	pattern: {
		icon: Palette,
		label: "Pattern",
		json: `{
  "app": "theme-token",
  "type": "theme-token:asset",
  "kind": "pattern",
  "mediaType": "image/svg+xml",
  "name": "Dot Grid",
  "version": "1.0.0",
  "description": "An evenly spaced dot grid",
  "author": "Jane Smith",
  "license": "CC0"
}`,
	},
	wallpaper: {
		icon: Image,
		label: "Wallpaper",
		json: `{
  "app": "theme-token",
  "type": "theme-token:asset",
  "kind": "wallpaper",
  "mediaType": "image/png",
  "name": "Gradient Mesh",
  "version": "1.0.0",
  "description": "An abstract gradient wallpaper",
  "author": "Alex Chen",
  "license": "CC0"
}`,
	},
};

const TYPES = Object.keys(EXAMPLES) as AssetType[];

export function OnChainProtocol() {
	const [active, setActive] = useState<AssetType>("theme");

	return (
		<div className="mx-auto max-w-3xl space-y-4">
			<div className="flex justify-center">
				<div className="inline-flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
					{TYPES.map((type) => {
						const { icon: Icon, label } = EXAMPLES[type];
						return (
							<button
								key={type}
								type="button"
								onClick={() => setActive(type)}
								className="relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
							>
								{active === type && (
									<motion.div
										layoutId="protocol-tab"
										className="absolute inset-0 rounded-md bg-background shadow-sm"
									/>
								)}
								<Icon className="relative z-10 h-4 w-4" />
								<span className="relative z-10 hidden sm:inline">{label}</span>
							</button>
						);
					})}
				</div>
			</div>

			<motion.div
				key={active}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
			>
				<CodeBlock
					code={EXAMPLES[active].json}
					language="json"
					filename={`${EXAMPLES[active].label} MAP metadata`}
				/>
			</motion.div>
		</div>
	);
}
