"use client";

import { type ThemeToken, validateThemeToken } from "@theme-token/sdk";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useTheme } from "@/components/theme-provider";
import { buildThemeMetadata, buildTileMetadata } from "@/lib/asset-metadata";
import { type ListOrdinalResult, listOrdinal } from "@/lib/list-ordinal";
import {
	type Addresses,
	type Balance,
	getYoursWallet,
	type InscribeResponse,
	isYoursWalletInstalled,
	type Ordinal,
	type SendBsvResult,
	type SocialProfile,
	sendBsv,
	submitToIndexer,
	type YoursWallet,
} from "@/lib/yours-wallet";

export type WalletStatus =
	| "not-installed"
	| "disconnected"
	| "connecting"
	| "connected"
	| "error";

export interface OwnedTheme {
	theme: ThemeToken;
	outpoint: string;
	origin: string;
}

export interface OwnedFont {
	outpoint: string;
	origin: string;
	metadata: {
		name: string;
		author?: string;
		license?: string;
		weight?: string;
		style?: string;
		prompt?: string;
	};
}

export interface OwnedPattern {
	outpoint: string;
	origin: string;
	metadata: {
		name?: string;
		prompt?: string;
	};
}

/** Asset types for bundle inscriptions */
export type BundleAssetType =
	| "font"
	| "pattern"
	| "wallpaper"
	| "theme"
	| "block"
	| "component"
	| "hook"
	| "lib"
	| "file";

/** Single item in a bundle inscription */
export interface BundleItem {
	/** Type of asset - determines MAP metadata */
	type: BundleAssetType;
	/** Base64-encoded data */
	base64Data: string;
	/** MIME type of the data */
	mimeType: string;
	/** Optional name for the asset */
	name?: string;
	/** Optional additional MAP metadata */
	metadata?: Record<string, string>;
}

/** Result of bundle inscription with typed origins */
export interface BundleInscribeResult {
	/** Transaction ID */
	txid: string;
	/** Raw transaction hex */
	rawtx: string;
	/** Origins for each item in order: [{txid}_0, {txid}_1, ...] */
	origins: string[];
}

interface WalletContextValue {
	status: WalletStatus;
	error: string | null;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	themeTokens: ThemeToken[];
	ownedThemes: OwnedTheme[];
	ownedFonts: OwnedFont[];
	ownedPatterns: OwnedPattern[];
	pendingThemes: OwnedTheme[];
	isLoading: boolean;
	refresh: () => Promise<void>;
	addresses: Addresses | null;
	balance: Balance | null;
	profile: SocialProfile | null;
	inscribeTheme: (theme: ThemeToken) => Promise<InscribeResponse | null>;
	inscribePattern: (
		svg: string,
		metadata?: {
			name?: string;
			author?: string;
			license?: string;
			prompt?: string;
			provider?: string;
			model?: string;
		},
	) => Promise<InscribeResponse | null>;
	inscribeImage: (
		base64Data: string,
		mimeType: string,
		metadata?: {
			name?: string;
			author?: string;
			license?: string;
			prompt?: string;
			aspectRatio?: string;
			style?: string;
			dimensions?: { width: number; height: number };
		},
	) => Promise<InscribeResponse | null>;
	isInscribing: boolean;
	listTheme: (
		outpoint: string,
		priceSatoshis: number,
	) => Promise<ListOrdinalResult | null>;
	isListing: boolean;
	sendPayment: (
		recipientAddress: string,
		amountSatoshis: number,
	) => Promise<SendBsvResult | null>;
	isSending: boolean;
	addPendingTheme: (theme: ThemeToken, txid: string) => void;
	/** Inscribe multiple items in a single transaction (multi-output bundle) */
	inscribeBundle: (items: BundleItem[]) => Promise<BundleInscribeResult | null>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<WalletStatus>("disconnected");
	const [error, setError] = useState<string | null>(null);
	const [themeTokens, setThemeTokens] = useState<ThemeToken[]>([]);
	const [ownedThemes, setOwnedThemes] = useState<OwnedTheme[]>([]);
	const [ownedFonts, setOwnedFonts] = useState<OwnedFont[]>([]);
	const [ownedPatterns, setOwnedPatterns] = useState<OwnedPattern[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [addresses, setAddresses] = useState<Addresses | null>(null);
	const [balance, setBalance] = useState<Balance | null>(null);
	const [profile, setProfile] = useState<SocialProfile | null>(null);
	const [isInscribing, setIsInscribing] = useState(false);
	const [isListing, setIsListing] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [pendingThemes, setPendingThemes] = useState<OwnedTheme[]>([]);
	const walletRef = useRef<YoursWallet | null>(null);
	const { availableThemes, setAvailableThemes, resetTheme } = useTheme();

	// Fetch theme tokens, fonts, and patterns from wallet
	const fetchThemeTokens = useCallback(async () => {
		const wallet = walletRef.current;
		if (!wallet) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await wallet.getOrdinals({ limit: 100 });
			const tokens: ThemeToken[] = [];
			const owned: OwnedTheme[] = [];
			const fonts: OwnedFont[] = [];
			const patterns: OwnedPattern[] = [];
			const ordinals = Array.isArray(response)
				? response
				: (response?.ordinals ?? []);

			for (const ordinal of ordinals) {
				try {
					const mapData = ordinal?.origin?.data?.map as
						| Record<string, string>
						| undefined;
					const fileType = ordinal?.origin?.data?.insc?.file?.type;

					// Check if it's a theme-token font
					if (
						mapData?.app === "theme-token" &&
						mapData?.type === "font" &&
						fileType?.startsWith("font/")
					) {
						fonts.push({
							outpoint: ordinal.outpoint,
							origin: ordinal.origin?.outpoint || ordinal.outpoint,
							metadata: {
								name: mapData.name || "Unknown Font",
								author: mapData.author,
								license: mapData.license,
								weight: mapData.weight || "400",
								style: mapData.style || "normal",
								prompt: mapData.prompt,
							},
						});
						continue;
					}

					// Check if it's a theme-token tile (SVG pattern/texture)
					if (
						mapData?.app === "theme-token" &&
						mapData?.type === "tile" &&
						fileType === "image/svg+xml"
					) {
						patterns.push({
							outpoint: ordinal.outpoint,
							origin: ordinal.origin?.outpoint || ordinal.outpoint,
							metadata: {
								name: mapData.name,
								prompt: mapData.prompt,
							},
						});
						continue;
					}

					// Check if it's a theme token
					const content = ordinal?.origin?.data?.insc?.file?.json;
					if (content && typeof content === "object") {
						const result = validateThemeToken(content);
						if (result.valid) {
							tokens.push(result.theme);
							owned.push({
								theme: result.theme,
								outpoint: ordinal.outpoint,
								origin: ordinal.origin?.outpoint || ordinal.outpoint,
							});
						}
					}
				} catch {
					// Skip invalid ordinals
				}
			}
			setThemeTokens(tokens);
			setOwnedThemes(owned);
			setOwnedFonts(fonts);
			setOwnedPatterns(patterns);
			setAvailableThemes(tokens);
		} catch (err) {
			console.error("[Wallet] Error fetching ordinals:", err);
			setError(err instanceof Error ? err.message : "Failed to fetch ordinals");
		} finally {
			setIsLoading(false);
		}
	}, [setAvailableThemes]);

	// Fetch wallet info (addresses, balance, profile)
	const fetchWalletInfo = useCallback(async () => {
		const wallet = walletRef.current;
		if (!wallet) return;

		try {
			// Get addresses and balance first
			console.log("[Wallet] Fetching addresses and balance...");
			const [addrs, bal] = await Promise.all([
				wallet.getAddresses(),
				wallet.getBalance(),
			]);
			console.log("[Wallet] Addresses:", addrs);
			console.log("[Wallet] Balance:", bal);
			setAddresses(addrs);
			setBalance(bal);

			// Only fetch profile after addresses are actually populated
			if (addrs?.bsvAddress && addrs?.ordAddress) {
				console.log("[Wallet] Fetching social profile...");
				const prof = await wallet.getSocialProfile().catch((err) => {
					console.error("[Wallet] getSocialProfile error:", err);
					return null;
				});
				console.log("[Wallet] Social profile response:", prof);
				if (prof) setProfile(prof);
			} else {
				console.log("[Wallet] Addresses not ready yet:", addrs);
			}
		} catch (err) {
			console.error("[Wallet] Failed to fetch wallet info:", err);
		}
	}, []);

	// Event handlers
	const handleSwitchAccount = useCallback(() => {
		fetchThemeTokens();
		fetchWalletInfo();
	}, [fetchThemeTokens, fetchWalletInfo]);

	const handleSignedOut = useCallback(() => {
		setStatus("disconnected");
		setThemeTokens([]);
		setOwnedThemes([]);
		setOwnedFonts([]);
		setOwnedPatterns([]);
		setAddresses(null);
		setBalance(null);
		setProfile(null);
		setAvailableThemes([]);
		resetTheme();
		walletRef.current?.disconnect().catch(console.error);
	}, [setAvailableThemes, resetTheme]);

	// Initialize wallet on mount
	useEffect(() => {
		let retryCount = 0;
		const maxRetries = 5;
		const retryDelay = 500;

		const initWallet = () => {
			if (!isYoursWalletInstalled()) {
				if (retryCount < maxRetries) {
					retryCount++;
					setTimeout(initWallet, retryDelay);
					return;
				}
				setStatus("not-installed");
				return;
			}

			const wallet = getYoursWallet();
			if (!wallet) {
				setStatus("not-installed");
				return;
			}

			walletRef.current = wallet;
			wallet.on("switchAccount", handleSwitchAccount);
			wallet.on("signedOut", handleSignedOut);

			wallet
				.isConnected()
				.then((connected) => {
					if (connected) {
						setStatus("connected");
						fetchThemeTokens();
						fetchWalletInfo();
					} else {
						setStatus("disconnected");
					}
				})
				.catch((err) => {
					setError(
						err instanceof Error ? err.message : "Connection check failed",
					);
					setStatus("error");
				});
		};

		initWallet();

		return () => {
			const wallet = walletRef.current;
			if (wallet) {
				wallet.removeListener("switchAccount", handleSwitchAccount);
				wallet.removeListener("signedOut", handleSignedOut);
			}
		};
	}, [handleSwitchAccount, handleSignedOut, fetchThemeTokens, fetchWalletInfo]);

	const connect = useCallback(async () => {
		const wallet = walletRef.current;
		if (!wallet) {
			setError("Wallet not available");
			return;
		}

		setStatus("connecting");
		setError(null);

		try {
			await wallet.connect();
			setStatus("connected");
			await fetchThemeTokens();
			await fetchWalletInfo();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Connection failed");
			setStatus("error");
		}
	}, [fetchThemeTokens, fetchWalletInfo]);

	const disconnect = useCallback(async () => {
		const wallet = walletRef.current;
		if (!wallet) return;

		try {
			await wallet.disconnect();
			setStatus("disconnected");
			setThemeTokens([]);
			setOwnedThemes([]);
			setOwnedFonts([]);
			setOwnedPatterns([]);
			setAddresses(null);
			setBalance(null);
			setProfile(null);
			setAvailableThemes([]);
			resetTheme();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Disconnect failed");
		}
	}, [setAvailableThemes, resetTheme]);

	const refresh = useCallback(async () => {
		if (status === "connected") {
			await fetchThemeTokens();
			await fetchWalletInfo();
		}
	}, [status, fetchThemeTokens, fetchWalletInfo]);

	const inscribeTheme = useCallback(
		async (theme: ThemeToken): Promise<InscribeResponse | null> => {
			const wallet = walletRef.current;
			if (!wallet || !addresses) {
				setError("Wallet not connected");
				return null;
			}

			setIsInscribing(true);
			setError(null);

			try {
				const jsonString = JSON.stringify(theme);
				const base64Data = btoa(jsonString);

				// Theme metadata is minimal - all info is in the JSON content
				const mapData = buildThemeMetadata();

				const response = await wallet.inscribe([
					{
						address: addresses.ordAddress,
						base64Data,
						mimeType: "application/json",
						map: mapData,
						satoshis: 1,
					},
				]);

				// Submit to indexer so it gets indexed immediately
				submitToIndexer(response.txid).catch(() => {});

				// Add to themes cache immediately so it shows up on homepage
				try {
					await fetch("/api/themes/cache", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							txid: response.txid,
							theme,
							owner: addresses.ordAddress,
						}),
					});
				} catch (cacheErr) {
					// Non-fatal - theme will appear once indexed
					console.warn("[Wallet] Failed to update themes cache:", cacheErr);
				}

				await fetchThemeTokens();
				await fetchWalletInfo();
				return response;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Inscription failed");
				return null;
			} finally {
				setIsInscribing(false);
			}
		},
		[addresses, fetchThemeTokens, fetchWalletInfo],
	);

	const inscribePattern = useCallback(
		async (
			svg: string,
			metadata?: {
				name?: string;
				author?: string;
				license?: string;
				prompt?: string;
				provider?: string;
				model?: string;
			},
		): Promise<InscribeResponse | null> => {
			const wallet = walletRef.current;
			if (!wallet || !addresses) {
				setError("Wallet not connected");
				return null;
			}

			setIsInscribing(true);
			setError(null);

			try {
				// SVG is text, encode to base64
				const base64Data = btoa(svg);

				// Build metadata with name, author, license, prompt, provider, model
				const mapData = buildTileMetadata({
					name: metadata?.name,
					author: metadata?.author,
					license: metadata?.license,
					prompt: metadata?.prompt,
					provider: metadata?.provider,
					model: metadata?.model,
				});

				const response = await wallet.inscribe([
					{
						address: addresses.ordAddress,
						base64Data,
						mimeType: "image/svg+xml",
						map: mapData,
						satoshis: 1,
					},
				]);

				// Submit to indexer
				submitToIndexer(response.txid).catch(() => {});

				await fetchThemeTokens();
				await fetchWalletInfo();
				return response;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Inscription failed");
				return null;
			} finally {
				setIsInscribing(false);
			}
		},
		[addresses, fetchThemeTokens, fetchWalletInfo],
	);

	const inscribeImage = useCallback(
		async (
			base64Data: string,
			mimeType: string,
			metadata?: {
				name?: string;
				author?: string;
				license?: string;
				prompt?: string;
				aspectRatio?: string;
				style?: string;
				dimensions?: { width: number; height: number };
			},
		): Promise<InscribeResponse | null> => {
			const wallet = walletRef.current;
			if (!wallet || !addresses) {
				setError("Wallet not connected");
				return null;
			}

			setIsInscribing(true);
			setError(null);

			try {
				// Build metadata with image-specific fields
				const mapData = buildTileMetadata({
					name: metadata?.name,
					author: metadata?.author,
					license: metadata?.license,
					prompt: metadata?.prompt,
				});

				// Add image-specific metadata
				if (metadata?.aspectRatio) {
					mapData.aspectRatio = metadata.aspectRatio;
				}
				if (metadata?.style) {
					mapData.style = metadata.style;
				}
				if (metadata?.dimensions) {
					mapData.width = String(metadata.dimensions.width);
					mapData.height = String(metadata.dimensions.height);
				}

				const response = await wallet.inscribe([
					{
						address: addresses.ordAddress,
						base64Data,
						mimeType,
						map: mapData,
						satoshis: 1,
					},
				]);

				// Submit to indexer
				submitToIndexer(response.txid).catch(() => {});

				await fetchThemeTokens();
				await fetchWalletInfo();
				return response;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Inscription failed");
				return null;
			} finally {
				setIsInscribing(false);
			}
		},
		[addresses, fetchThemeTokens, fetchWalletInfo],
	);

	const listTheme = useCallback(
		async (
			outpoint: string,
			priceSatoshis: number,
		): Promise<ListOrdinalResult | null> => {
			const wallet = walletRef.current;
			if (!wallet) {
				setError("Wallet not connected");
				return null;
			}

			const ownedTheme = ownedThemes.find((t) => t.outpoint === outpoint);
			if (!ownedTheme) {
				setError("Theme not found in wallet");
				return null;
			}

			setIsListing(true);
			setError(null);

			try {
				const response = await wallet.getOrdinals({ limit: 100 });
				const ordinals = Array.isArray(response)
					? response
					: (response?.ordinals ?? []);
				const ordinal = ordinals.find((o) => o.outpoint === outpoint) as
					| Ordinal
					| undefined;

				if (!ordinal) throw new Error("Ordinal not found");

				const result = await listOrdinal(wallet, { ordinal, priceSatoshis });
				await fetchThemeTokens();
				await fetchWalletInfo();
				return result;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Listing failed");
				return null;
			} finally {
				setIsListing(false);
			}
		},
		[ownedThemes, fetchThemeTokens, fetchWalletInfo],
	);

	const sendPayment = useCallback(
		async (
			recipientAddress: string,
			amountSatoshis: number,
		): Promise<SendBsvResult | null> => {
			const wallet = walletRef.current;
			if (!wallet) {
				setError("Wallet not connected");
				return null;
			}

			setIsSending(true);
			setError(null);

			try {
				const result = await sendBsv(wallet, recipientAddress, amountSatoshis);
				await fetchWalletInfo();
				return result;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Payment failed");
				return null;
			} finally {
				setIsSending(false);
			}
		},
		[fetchWalletInfo],
	);

	// Add a theme to pending state (optimistic ownership before wallet confirms)
	const addPendingTheme = useCallback(
		(theme: ThemeToken, txid: string) => {
			const origin = `${txid}_0`;
			const pendingTheme: OwnedTheme = {
				theme,
				outpoint: origin,
				origin,
			};
			setPendingThemes((prev) => [...prev, pendingTheme]);
			// Also add to available themes for immediate dropdown selection
			setAvailableThemes([...availableThemes, theme]);
		},
		[availableThemes, setAvailableThemes],
	);

	/**
	 * Inscribe multiple items in a single transaction (multi-output bundle)
	 *
	 * Items are inscribed in array order - first item becomes vout 0, second vout 1, etc.
	 * For theme bundles, inscribe assets FIRST then theme LAST so theme can reference
	 * sibling assets via {{vout:N}} placeholders.
	 *
	 * Example: [font, pattern, theme] → font at _0, pattern at _1, theme at _2
	 */
	const inscribeBundle = useCallback(
		async (items: BundleItem[]): Promise<BundleInscribeResult | null> => {
			const wallet = walletRef.current;
			if (!wallet || !addresses) {
				setError("Wallet not connected");
				return null;
			}

			if (items.length === 0) {
				setError("Bundle must contain at least one item");
				return null;
			}

			setIsInscribing(true);
			setError(null);

			try {
				// Convert BundleItems to InscribeRequests
				const inscribeRequests = items.map((item) => {
					// Build MAP metadata based on asset type
					const mapData: Record<string, string> = {
						app: "theme-token",
						type: item.type,
					};

					// Add name if provided
					if (item.name) {
						mapData.name = item.name;
					}

					// Merge any additional metadata
					if (item.metadata) {
						Object.assign(mapData, item.metadata);
					}

					return {
						address: addresses.ordAddress,
						base64Data: item.base64Data,
						mimeType: item.mimeType,
						map: mapData,
						satoshis: 1,
					};
				});

				// Inscribe all items in a single transaction
				const response = await wallet.inscribe(inscribeRequests);

				// Submit to indexer
				submitToIndexer(response.txid).catch(() => {});

				// Generate origins for each vout
				const origins = items.map((_, index) => `${response.txid}_${index}`);

				await fetchThemeTokens();
				await fetchWalletInfo();

				return {
					txid: response.txid,
					rawtx: response.rawtx,
					origins,
				};
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Bundle inscription failed",
				);
				return null;
			} finally {
				setIsInscribing(false);
			}
		},
		[addresses, fetchThemeTokens, fetchWalletInfo],
	);

	return (
		<WalletContext.Provider
			value={{
				status,
				error,
				connect,
				disconnect,
				themeTokens,
				ownedThemes,
				ownedFonts,
				ownedPatterns,
				pendingThemes,
				isLoading,
				refresh,
				addresses,
				balance,
				profile,
				inscribeTheme,
				inscribePattern,
				inscribeImage,
				isInscribing,
				listTheme,
				isListing,
				sendPayment,
				isSending,
				addPendingTheme,
				inscribeBundle,
			}}
		>
			{children}
		</WalletContext.Provider>
	);
}

export function useYoursWallet(): WalletContextValue {
	const context = useContext(WalletContext);
	if (!context) {
		throw new Error("useYoursWallet must be used within a WalletProvider");
	}
	return context;
}
