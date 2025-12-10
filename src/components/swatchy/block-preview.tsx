"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Code2, Copy, Check, FileCode, Package, Blocks, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSwatchyStore, type GeneratedRegistryItem } from "./swatchy-store";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { InscribeBundleDialog } from "@/components/inscribe-bundle-dialog";
import { buildRegistryBundle, type RegistryManifest } from "@/lib/bundle-builder";

interface BlockPreviewProps {
	item: GeneratedRegistryItem;
}

export function BlockPreview({ item }: BlockPreviewProps) {
	const { manifest } = item;
	const [expandedFile, setExpandedFile] = useState<number | null>(0); // First file expanded by default
	const [copiedFile, setCopiedFile] = useState<number | null>(null);
	const [showInscribeDialog, setShowInscribeDialog] = useState(false);
	const [inscribedOrigin, setInscribedOrigin] = useState<string | null>(null);
	const { clearGeneratedRegistryItem } = useSwatchyStore();
	const { inscribeBundle, isInscribing, status: walletStatus } = useYoursWallet();

	const isBlock = manifest.type === "registry:block";
	const Icon = isBlock ? Blocks : FileCode;
	const isWalletConnected = walletStatus === "connected";

	// Build bundle items for inscription
	const bundleResult = buildRegistryBundle({
		manifest: manifest as RegistryManifest,
	});

	const handleInscribe = useCallback(async () => {
		const result = await inscribeBundle(bundleResult.items);
		if (result) {
			// First origin is the manifest (vout 0)
			setInscribedOrigin(result.origins[0]);
			setShowInscribeDialog(false);
		}
		return result;
	}, [inscribeBundle, bundleResult.items]);

	const copyInstallCommand = useCallback(async () => {
		if (!inscribedOrigin) return;
		const route = isBlock ? "blocks" : "components";
		const command = `bunx shadcn@latest add https://themetoken.dev/r/${route}/${inscribedOrigin}`;
		await navigator.clipboard.writeText(command);
	}, [inscribedOrigin, isBlock]);

	const copyToClipboard = async (content: string, fileIndex: number) => {
		await navigator.clipboard.writeText(content);
		setCopiedFile(fileIndex);
		setTimeout(() => setCopiedFile(null), 2000);
	};

	const toggleFile = (index: number) => {
		setExpandedFile(expandedFile === index ? null : index);
	};

	return (
		<motion.div
			className="mt-3 rounded-lg border bg-card overflow-hidden"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
				<div className="flex items-center gap-2">
					<Icon className="h-4 w-4 text-primary" />
					<span className="text-sm font-medium">{manifest.name}</span>
					<span className="text-xs text-muted-foreground">
						{isBlock ? "block" : "component"}
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 text-xs"
					onClick={clearGeneratedRegistryItem}
				>
					Dismiss
				</Button>
			</div>

			{/* Description */}
			<div className="px-3 py-2 border-b">
				<p className="text-xs text-muted-foreground">{manifest.description}</p>
			</div>

			{/* Dependencies */}
			{(manifest.dependencies.length > 0 || manifest.registryDependencies.length > 0) && (
				<div className="px-3 py-2 border-b flex flex-wrap gap-1.5">
					{manifest.registryDependencies.map((dep) => (
						<span
							key={dep}
							className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary"
						>
							<Package className="h-2.5 w-2.5" />
							{dep}
						</span>
					))}
					{manifest.dependencies.map((dep) => (
						<span
							key={dep}
							className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
						>
							{dep}
						</span>
					))}
				</div>
			)}

			{/* Files */}
			<div className="divide-y">
				{manifest.files.map((file, index) => (
					<div key={file.path} className="group">
						{/* File header */}
						<button
							type="button"
							onClick={() => toggleFile(index)}
							className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors"
						>
							<div className="flex items-center gap-2">
								{expandedFile === index ? (
									<ChevronDown className="h-3 w-3 text-muted-foreground" />
								) : (
									<ChevronRight className="h-3 w-3 text-muted-foreground" />
								)}
								<Code2 className="h-3 w-3 text-muted-foreground" />
								<span className="text-xs font-mono">{file.path}</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className={cn(
									"h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
									copiedFile === index && "opacity-100"
								)}
								onClick={(e) => {
									e.stopPropagation();
									copyToClipboard(file.content, index);
								}}
							>
								{copiedFile === index ? (
									<Check className="h-3 w-3 text-green-500" />
								) : (
									<Copy className="h-3 w-3" />
								)}
							</Button>
						</button>

						{/* File content */}
						{expandedFile === index && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.2 }}
							>
								<pre className="px-3 py-2 bg-muted/30 text-[10px] leading-relaxed font-mono overflow-x-auto max-h-48 overflow-y-auto">
									<code className="text-foreground/80">{file.content}</code>
								</pre>
							</motion.div>
						)}
					</div>
				))}
			</div>

			{/* Footer with inscribe CTA or success state */}
			<div className="px-3 py-2 border-t bg-muted/20 flex items-center justify-between">
				{inscribedOrigin ? (
					<>
						<div className="flex items-center gap-1.5">
							<CheckCircle2 className="h-3 w-3 text-green-500" />
							<p className="text-[10px] text-green-600 dark:text-green-400">
								Inscribed! Origin: {inscribedOrigin.slice(0, 12)}...
							</p>
						</div>
						<Button
							size="sm"
							variant="outline"
							className="h-6 text-xs"
							onClick={copyInstallCommand}
						>
							<Copy className="h-3 w-3 mr-1" />
							Copy Install
						</Button>
					</>
				) : (
					<>
						<p className="text-[10px] text-muted-foreground">
							{isWalletConnected
								? "Inscribe to make installable via CLI"
								: "Connect wallet to inscribe"}
						</p>
						<Button
							size="sm"
							className="h-6 text-xs"
							disabled={!isWalletConnected}
							onClick={() => setShowInscribeDialog(true)}
						>
							Inscribe
						</Button>
					</>
				)}
			</div>

			{/* Inscribe Bundle Dialog */}
			<InscribeBundleDialog
				isOpen={showInscribeDialog}
				onClose={() => setShowInscribeDialog(false)}
				items={bundleResult.items}
				onConfirm={handleInscribe}
				isInscribing={isInscribing}
				title={`Inscribe ${isBlock ? "Block" : "Component"}`}
				description={`${manifest.files.length} file(s) will be inscribed as a multi-output transaction`}
			/>
		</motion.div>
	);
}
