"use client";

import { Check, ChevronDown, Link as LinkIcon, Type, Upload, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useYoursWallet, type OwnedFont } from "@/hooks/use-yours-wallet";
import { loadFontByOrigin, getCachedFont, isOnChainFont, extractOriginFromPath } from "@/lib/font-loader";
import {
	useFontUploadStore,
	createUploadedFontFromFile,
	isUploadedFontPath,
	extractUploadedFontId,
	createUploadedFontPath,
} from "@/lib/stores/font-upload-store";

type FontSource = "google" | "onchain" | "uploaded" | "custom";

interface FontSelectorProps {
	slot: "sans" | "serif" | "mono";
	value: string; // Current font value (Google Font name or /content/{origin})
	onChange: (value: string) => void;
	label?: string;
}

// Common Google Fonts for quick selection
const SUGGESTED_FONTS: Record<string, string[]> = {
	sans: ["Inter", "Roboto", "Open Sans", "Lato", "Poppins", "Montserrat", "Nunito", "Work Sans"],
	serif: ["Playfair Display", "Merriweather", "Lora", "Crimson Text", "Libre Baskerville", "Source Serif Pro"],
	mono: ["JetBrains Mono", "Fira Code", "Source Code Pro", "IBM Plex Mono", "Roboto Mono", "Space Mono"],
};

export function FontSelector({ slot, value, onChange, label }: FontSelectorProps) {
	const { ownedFonts, status: walletStatus, connect } = useYoursWallet();
	const isConnected = walletStatus === "connected";
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Font upload store
	const { uploadedFonts, addFont, loadFontForPreview, getFont } = useFontUploadStore();

	// Determine current source based on value
	const getCurrentSource = (): FontSource => {
		if (!value) return "google";
		if (isUploadedFontPath(value)) return "uploaded";
		if (isOnChainFont(value)) return "onchain";
		// If it looks like a txid_vout pattern (for manual entry), treat as custom
		if (/^[a-f0-9]{64}_\d+$/i.test(value)) return "custom";
		return "google";
	};

	const [source, setSource] = useState<FontSource>(getCurrentSource);
	const [customOrigin, setCustomOrigin] = useState("");
	const [loadedFontFamily, setLoadedFontFamily] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	// Get current on-chain origin if applicable
	const currentOrigin = isOnChainFont(value) ? extractOriginFromPath(value) : null;

	// Get current uploaded font ID if applicable
	const currentUploadedId = isUploadedFontPath(value) ? extractUploadedFontId(value) : null;
	const currentUploadedFont = currentUploadedId ? getFont(currentUploadedId) : null;

	// Find the owned font matching current value
	const currentOwnedFont = currentOrigin
		? ownedFonts.find((f) => f.origin === currentOrigin)
		: null;

	// Load font preview for current on-chain or uploaded font
	const loadCurrentFont = useCallback(async () => {
		// Handle uploaded fonts
		if (currentUploadedId) {
			try {
				const family = await loadFontForPreview(currentUploadedId);
				setLoadedFontFamily(family);
			} catch {
				setLoadedFontFamily(null);
			}
			return;
		}

		// Handle on-chain fonts
		if (!currentOrigin) {
			setLoadedFontFamily(null);
			return;
		}

		const cached = getCachedFont(currentOrigin);
		if (cached) {
			setLoadedFontFamily(cached.familyName);
			return;
		}

		try {
			const family = await loadFontByOrigin(currentOrigin);
			setLoadedFontFamily(family);
		} catch {
			setLoadedFontFamily(null);
		}
	}, [currentOrigin, currentUploadedId, loadFontForPreview]);

	useEffect(() => {
		loadCurrentFont();
	}, [loadCurrentFont]);

	// Handle file upload
	const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const fontData = await createUploadedFontFromFile(file);
			const id = addFont(fontData);

			// Load the font for preview
			await loadFontForPreview(id);

			// Set the value to the uploaded font path
			onChange(createUploadedFontPath(id));
		} catch (err) {
			console.error("[FontSelector] Upload error:", err);
		} finally {
			setIsUploading(false);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	}, [addFont, loadFontForPreview, onChange]);

	// Handle selecting an already-uploaded font
	const handleUploadedFontSelect = useCallback(async (id: string) => {
		try {
			await loadFontForPreview(id);
			onChange(createUploadedFontPath(id));
		} catch (err) {
			console.error("[FontSelector] Error loading uploaded font:", err);
		}
	}, [loadFontForPreview, onChange]);

	// Handle source change
	const handleSourceChange = (newSource: FontSource) => {
		setSource(newSource);
		if (newSource === "google" && isOnChainFont(value)) {
			// Reset to default Google Font
			onChange(SUGGESTED_FONTS[slot][0]);
		}
	};

	// Handle Google Font selection
	const handleGoogleFontSelect = (fontName: string) => {
		onChange(fontName);
	};

	// Handle owned font selection
	const handleOwnedFontSelect = (font: OwnedFont) => {
		// Use /content/{origin} format
		onChange(`/content/${font.origin}`);
	};

	// Handle custom origin submission
	const handleCustomOriginSubmit = () => {
		if (customOrigin.trim()) {
			// Accept either raw origin or full path
			const origin = customOrigin.startsWith("/content/")
				? customOrigin
				: `/content/${customOrigin.trim()}`;
			onChange(origin);
			setCustomOrigin("");
		}
	};

	// Display label for current value
	const getDisplayLabel = (): string => {
		if (!value) return "Select font...";
		if (currentUploadedFont) return `${currentUploadedFont.familyName} (uploaded)`;
		if (currentOwnedFont) return currentOwnedFont.metadata.name;
		if (isOnChainFont(value)) return `On-chain: ${currentOrigin?.slice(0, 8)}...`;
		// Extract primary font name from font stack (e.g., '"Space Grotesk", "Inter", ...' -> 'Space Grotesk')
		const match = value.match(/^["']?([^"',]+)["']?/);
		return match?.[1] || value;
	};

	return (
		<div className="space-y-3">
			{label && (
				<Label className="text-sm font-medium">{label}</Label>
			)}

			{/* Source Selection */}
			<RadioGroup
				value={source}
				onValueChange={(v) => handleSourceChange(v as FontSource)}
				className="flex flex-wrap gap-x-4 gap-y-2"
			>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="google" id={`${slot}-google`} />
					<Label htmlFor={`${slot}-google`} className="text-xs cursor-pointer">
						Google
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="uploaded" id={`${slot}-uploaded`} />
					<Label htmlFor={`${slot}-uploaded`} className="text-xs cursor-pointer">
						Upload
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="onchain" id={`${slot}-onchain`} />
					<Label htmlFor={`${slot}-onchain`} className="text-xs cursor-pointer">
						On-Chain
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="custom" id={`${slot}-custom`} />
					<Label htmlFor={`${slot}-custom`} className="text-xs cursor-pointer">
						Custom
					</Label>
				</div>
			</RadioGroup>

			{/* Google Fonts Dropdown */}
			{source === "google" && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="w-full justify-between font-normal"
							style={{ fontFamily: !isOnChainFont(value) ? value : undefined }}
						>
							<span className="truncate">{getDisplayLabel()}</span>
							<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
						<DropdownMenuLabel>Suggested Fonts</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{SUGGESTED_FONTS[slot].map((fontName) => (
							<DropdownMenuItem
								key={fontName}
								onClick={() => handleGoogleFontSelect(fontName)}
								className="justify-between"
							>
								<span style={{ fontFamily: fontName }}>{fontName}</span>
								{value === fontName && <Check className="h-4 w-4" />}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			)}

			{/* Uploaded Fonts */}
			{source === "uploaded" && (
				<>
					{/* Hidden file input */}
					<input
						ref={fileInputRef}
						type="file"
						accept=".woff2,.woff,.ttf,.otf"
						onChange={handleFileUpload}
						className="hidden"
					/>

					{/* Upload button or dropdown if fonts exist */}
					{uploadedFonts.length === 0 ? (
						<Button
							variant="outline"
							className="w-full"
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
						>
							<Upload className="mr-2 h-4 w-4" />
							{isUploading ? "Uploading..." : "Upload Font File"}
						</Button>
					) : (
						<div className="space-y-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-between font-normal"
										style={{ fontFamily: loadedFontFamily || undefined }}
									>
										<span className="truncate">{getDisplayLabel()}</span>
										<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-64 max-h-64 overflow-y-auto">
									<DropdownMenuLabel>Uploaded Fonts</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{uploadedFonts.map((font) => (
										<DropdownMenuItem
											key={font.id}
											onClick={() => handleUploadedFontSelect(font.id)}
											className="justify-between"
										>
											<div className="flex flex-col">
												<span>{font.familyName}</span>
												<span className="text-[10px] text-muted-foreground">
													{(font.sizeBytes / 1024).toFixed(1)} KB
												</span>
											</div>
											{currentUploadedId === font.id && <Check className="h-4 w-4" />}
										</DropdownMenuItem>
									))}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => fileInputRef.current?.click()}
										className="text-muted-foreground"
									>
										<Upload className="mr-2 h-4 w-4" />
										Upload another...
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}

					<p className="text-[10px] text-muted-foreground">
						Upload .woff2, .woff, .ttf, or .otf files for preview
					</p>
				</>
			)}

			{/* On-Chain Fonts (Owned) */}
			{source === "onchain" && (
				<>
					{!isConnected ? (
						<Button variant="outline" className="w-full" onClick={connect}>
							<Wallet className="mr-2 h-4 w-4" />
							Connect to see your fonts
						</Button>
					) : ownedFonts.length === 0 ? (
						<div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
							<Type className="mx-auto mb-2 h-6 w-6 opacity-50" />
							<p>No fonts owned</p>
							<a
								href="/market/fonts"
								className="text-primary hover:underline text-xs"
							>
								Browse marketplace
							</a>
						</div>
					) : (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-between font-normal"
									style={{ fontFamily: loadedFontFamily || undefined }}
								>
									<span className="truncate">{getDisplayLabel()}</span>
									<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-64 max-h-64 overflow-y-auto">
								<DropdownMenuLabel>Your Fonts</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{ownedFonts.map((font) => (
									<DropdownMenuItem
										key={font.origin}
										onClick={() => handleOwnedFontSelect(font)}
										className="justify-between"
									>
										<div className="flex flex-col">
											<span>{font.metadata.name}</span>
											<span className="text-[10px] text-muted-foreground font-mono">
												{font.origin.slice(0, 12)}...
											</span>
										</div>
										{currentOrigin === font.origin && <Check className="h-4 w-4" />}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</>
			)}

			{/* Custom Origin Input */}
			{source === "custom" && (
				<div className="flex gap-2">
					<Input
						placeholder="Enter font origin (txid_vout)"
						value={customOrigin}
						onChange={(e) => setCustomOrigin(e.target.value)}
						className="flex-1 font-mono text-xs"
					/>
					<Button
						variant="outline"
						size="icon"
						onClick={handleCustomOriginSubmit}
						disabled={!customOrigin.trim()}
					>
						<LinkIcon className="h-4 w-4" />
					</Button>
				</div>
			)}

			{/* Preview */}
			{value && (
				<div
					className="mt-2 rounded-md border bg-muted/30 p-3 text-center"
					style={{
						fontFamily: loadedFontFamily || (!isOnChainFont(value) ? value : undefined),
					}}
				>
					<div className="text-2xl">Aa Bb Cc</div>
					<div className="text-xs text-muted-foreground mt-1">The quick brown fox</div>
				</div>
			)}
		</div>
	);
}
