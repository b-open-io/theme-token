"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Copy, Check, FileCode, Package, Blocks, ChevronDown, ChevronRight, CheckCircle2, Play, X, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSwatchyStore, type GeneratedRegistryItem } from "./swatchy-store";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { InscribeBundleDialog } from "@/components/inscribe-bundle-dialog";
import { buildRegistryBundle, type RegistryManifest } from "@/lib/bundle-builder";
import { featureFlags } from "@/lib/feature-flags";

interface BlockPreviewProps {
	item: GeneratedRegistryItem;
}

export function BlockPreview({ item }: BlockPreviewProps) {
	const { manifest, validation } = item;
	const [expandedFile, setExpandedFile] = useState<number | null>(0); // First file expanded by default
	const [copiedFile, setCopiedFile] = useState<number | null>(null);
	const [showInscribeDialog, setShowInscribeDialog] = useState(false);
	const [inscribedOrigin, setInscribedOrigin] = useState<string | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [previewHtml, setPreviewHtml] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const { clearGeneratedRegistryItem } = useSwatchyStore();
	const { inscribeBundle, isInscribing, status: walletStatus } = useYoursWallet();

	const isBlock = manifest.type === "registry:block";
	const Icon = isBlock ? Blocks : FileCode;
	const isWalletConnected = walletStatus === "connected";
	const canPreview = featureFlags.componentPreview;

	// Validation info
	const validationAttempts = validation?.attempts || 1;
	const hadRetries = validationAttempts > 1;
	const hasWarnings = validation?.warnings && validation.warnings.length > 0;

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

	// Generate a live preview of the component
	const handlePreview = useCallback(async () => {
		if (previewHtml || previewUrl) {
			// Already have preview, just show it
			setShowPreview(true);
			return;
		}

		setPreviewLoading(true);
		setPreviewError(null);

		try {
			// Get the main component file (first .tsx file)
			const mainFile = manifest.files.find(
				(f) => f.path.endsWith(".tsx") || f.path.endsWith(".jsx"),
			);

			if (!mainFile) {
				throw new Error("No component file found");
			}

			// Try the fast inline preview first (srcDoc). If it fails (e.g., CSP or import issues),
			// fall back to Vercel Sandbox which runs in an isolated VM and serves a URL.
			{
				const response = await fetch("/api/preview-component", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						code: mainFile.content,
					}),
				});

				const data = await response.json();

				if (response.ok && data.success && data.html) {
					setPreviewHtml(data.html);
					setShowPreview(true);
					return;
				}
			}

			const sandboxResponse = await fetch("/api/preview-component-sandbox", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					code: mainFile.content,
				}),
			});

			const sandboxData = await sandboxResponse.json();

			if (!sandboxResponse.ok || !sandboxData.success || !sandboxData.url) {
				throw new Error(sandboxData.error || "Failed to generate sandbox preview");
			}

			setPreviewUrl(sandboxData.url);
			setShowPreview(true);
		} catch (error) {
			setPreviewError(
				error instanceof Error ? error.message : "Failed to generate preview",
			);
		} finally {
			setPreviewLoading(false);
		}
	}, [manifest.files, previewHtml, previewUrl]);

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
					{hadRetries && (
						<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400">
							<RefreshCw className="h-2.5 w-2.5" />
							{validationAttempts} tries
						</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					{canPreview && (
						<Button
							variant="ghost"
							size="sm"
							className="h-6 text-xs gap-1"
							onClick={handlePreview}
							disabled={previewLoading}
						>
							{previewLoading ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<Play className="h-3 w-3" />
							)}
							Preview
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						className="h-6 text-xs"
						onClick={clearGeneratedRegistryItem}
					>
						Dismiss
					</Button>
				</div>
			</div>

			{/* Description */}
			<div className="px-3 py-2 border-b">
				<p className="text-xs text-muted-foreground">{manifest.description}</p>
			</div>

			{/* Validation Warnings */}
			{hasWarnings && (
				<div className="px-3 py-2 border-b bg-amber-500/5">
					<div className="flex items-start gap-2">
						<AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
						<div className="space-y-0.5">
							{validation?.warnings.map((warning, idx) => (
								<p key={idx} className="text-[10px] text-amber-600 dark:text-amber-400">
									{warning}
								</p>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Live Preview Panel */}
			<AnimatePresence>
				{showPreview && (previewHtml || previewUrl) && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="border-b"
					>
						<div className="flex items-center justify-between bg-muted/50 px-3 py-1.5">
							<span className="text-xs font-medium text-muted-foreground">
								Live Preview
							</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-5 w-5 p-0"
								onClick={() => setShowPreview(false)}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
						<div className="bg-background p-2">
							<iframe
								src={previewUrl ?? undefined}
								srcDoc={previewUrl ? undefined : (previewHtml ?? undefined)}
								title="Component Preview"
								className="w-full h-64 rounded border bg-white"
								sandbox="allow-scripts"
								referrerPolicy="no-referrer"
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Preview Error */}
			{previewError && (
				<div className="px-3 py-2 border-b bg-destructive/10">
					<p className="text-xs text-destructive">{previewError}</p>
				</div>
			)}

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
						{/* File header - separate row button from copy button */}
						<div className="flex items-center justify-between hover:bg-muted/50 transition-colors">
							<Button
								variant="ghost"
								className="flex-1 justify-start gap-2 px-3 py-2 h-auto rounded-none"
								onClick={() => toggleFile(index)}
							>
								{expandedFile === index ? (
									<ChevronDown className="h-3 w-3 text-muted-foreground" />
								) : (
									<ChevronRight className="h-3 w-3 text-muted-foreground" />
								)}
								<Code2 className="h-3 w-3 text-muted-foreground" />
								<span className="text-xs font-mono">{file.path}</span>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className={cn(
									"h-8 w-8 p-0 mr-1 opacity-0 group-hover:opacity-100 transition-opacity",
									copiedFile === index && "opacity-100"
								)}
								onClick={() => copyToClipboard(file.content, index)}
							>
								{copiedFile === index ? (
									<Check className="h-3 w-3 text-green-500" />
								) : (
									<Copy className="h-3 w-3" />
								)}
							</Button>
						</div>

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
