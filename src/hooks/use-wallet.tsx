"use client";

import {
	type WalletStatus as OneSatWalletStatus,
	useWallet as useOneSatWallet,
} from "@1sat/react";
import type { WalletInterface, WalletOutput } from "@bsv/sdk";
import {
	getOrdfsUrl,
	type ThemeToken,
	validateThemeToken,
} from "@theme-token/sdk";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTheme } from "@/components/theme-provider";
import { type ListOrdinalResult, listOrdinal } from "@/lib/list-ordinal";
import { bundleItemsToPackage, publishPackage } from "@/lib/package-builder";
// Import and re-export pricing constants
import { PRISM_PASS_COLLECTION_ID, PRISM_PASS_DISCOUNT } from "@/lib/pricing";
import {
	getIdentityKey,
	getOrdinalAddress,
	getOwnedOrdinals,
	getPaymentAddress,
	getSocialProfile,
	inscribeImage as walletInscribeImage,
	inscribePattern as walletInscribePattern,
	inscribeTheme as walletInscribeTheme,
	sendPayment as walletSendPayment,
} from "@/lib/wallet-actions";
import type {
	Addresses,
	InscribeResponse,
	SendBsvResult,
	SocialProfile,
} from "@/lib/yours-wallet";

export { PRISM_PASS_COLLECTION_ID, PRISM_PASS_DISCOUNT };

/**
 * Theme-token wallet status.
 * Maps from @1sat/react's WalletStatus to a superset that includes "not-installed" and "error".
 */
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
	| "project"
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
	/** Origins for all outputs including manifest: [{txid}_0, {txid}_1, ...] */
	origins: string[];
	/** Origin of the package manifest (the package identity on-chain) */
	manifestOrigin: string;
}

/** Configuration for minting a collection item */
export interface MintCollectionItemConfig {
	/** Collection ID (origin outpoint of the collection inscription) */
	collectionId: string;
	/** Name for this specific item */
	name: string;
	/** Optional mint number */
	mintNumber?: number;
	/** Optional traits for this item */
	traits?: Array<{
		name: string;
		value: string;
		rarityLabel?: string;
		occurancePercentage?: string;
	}>;
	/** Optional rarity label */
	rarityLabel?: string;
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
	/** Whether user owns a Prism Pass membership NFT */
	hasPrismPass: boolean;
	isLoading: boolean;
	refresh: () => Promise<void>;
	addresses: Addresses | null;
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
	/** Mint a collection item (e.g., Prism Pass) */
	mintCollectionItem: (
		config: MintCollectionItemConfig,
	) => Promise<InscribeResponse | null>;
}

/**
 * Map @1sat/react's WalletStatus to theme-token's WalletStatus.
 */
function mapWalletStatus(oneSatStatus: OneSatWalletStatus): WalletStatus {
	switch (oneSatStatus) {
		case "connected":
			return "connected";
		case "connecting":
			return "connecting";
		case "detecting":
			return "connecting";
		case "selecting":
			return "disconnected";
		case "disconnected":
			return "disconnected";
		default:
			return "disconnected";
	}
}

/**
 * Categorize the wallet's basket outputs into themes, fonts, and patterns.
 *
 * Outputs come from the provider's ordinals basket (getOrdinals). They are
 * sparse — each carries the MAP tags we set at inscription time, e.g.
 * `registry:style:Name@1.0.0` — so we categorize by tag and hydrate theme
 * content from ORDFS by outpoint. For freshly inscribed (wallet-owned) items
 * the outpoint is the origin, which is exactly what ORDFS needs.
 */
async function categorizeOrdinals(outputs: WalletOutput[]): Promise<{
	tokens: ThemeToken[];
	owned: OwnedTheme[];
	fonts: OwnedFont[];
	patterns: OwnedPattern[];
	hasPrismPass: boolean;
}> {
	const tokens: ThemeToken[] = [];
	const owned: OwnedTheme[] = [];
	const fonts: OwnedFont[] = [];
	const patterns: OwnedPattern[] = [];
	let hasPrismPass = false;

	// Theme package outpoints to hydrate from ORDFS (content isn't in the
	// sparse basket output).
	const styleCandidates: string[] = [];

	for (const output of outputs) {
		const tags = output.tags ?? [];
		const { outpoint } = output;

		// Pull the name from a `prefix:Name@version` tag.
		const nameFromTag = (prefix: string): string | null => {
			const tag = tags.find((t) => t.startsWith(prefix));
			return tag ? tag.slice(prefix.length).split("@")[0] : null;
		};

		if (tags.some((t) => t.startsWith("registry:style:"))) {
			styleCandidates.push(outpoint);
			continue;
		}

		const fontName = nameFromTag("registry:font:");
		if (fontName) {
			fonts.push({
				outpoint,
				origin: outpoint,
				metadata: { name: fontName, weight: "400", style: "normal" },
			});
			continue;
		}

		const fileName = nameFromTag("registry:file:");
		if (fileName) {
			patterns.push({
				outpoint,
				origin: outpoint,
				metadata: { name: fileName },
			});
			continue;
		}

		// Prism Pass membership NFT (collection item).
		if (tags.some((t) => t.includes(PRISM_PASS_COLLECTION_ID))) {
			hasPrismPass = true;
		}
	}

	// Hydrate theme packages: fetch theme.json from ORDFS by outpoint.
	if (styleCandidates.length > 0) {
		const results = await Promise.allSettled(
			styleCandidates.map(async (outpoint) => {
				const res = await fetch(getOrdfsUrl(`${outpoint}/theme.json`));
				if (!res.ok) return null;
				const themeJson = await res.json();
				const validation = validateThemeToken(themeJson);
				if (!validation.valid) return null;
				return { outpoint, theme: validation.theme };
			}),
		);
		for (const result of results) {
			if (result.status === "fulfilled" && result.value) {
				tokens.push(result.value.theme);
				owned.push({
					theme: result.value.theme,
					outpoint: result.value.outpoint,
					origin: result.value.outpoint,
				});
			}
		}
	}

	return { tokens, owned, fonts, patterns, hasPrismPass };
}

const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * WalletProvider — provides theme-token-specific wallet context.
 *
 * Uses `useWallet()` from `@1sat/react` to obtain the underlying WalletInterface,
 * then delegates operations to `wallet-actions.ts` (which uses `@1sat/actions`).
 *
 * NOTE: The `@1sat/react` `WalletProvider` must wrap this component higher in the
 * tree (typically in providers.tsx).
 */
export function WalletProvider({ children }: { children: ReactNode }) {
	const {
		wallet,
		status: oneSatStatus,
		connect: oneSatConnect,
		disconnect: oneSatDisconnect,
		error: oneSatError,
	} = useOneSatWallet();

	const [error, setError] = useState<string | null>(null);
	const [hasPrismPass, setHasPrismPass] = useState(false);
	const [themeTokens, setThemeTokens] = useState<ThemeToken[]>([]);
	const [ownedThemes, setOwnedThemes] = useState<OwnedTheme[]>([]);
	const [ownedFonts, setOwnedFonts] = useState<OwnedFont[]>([]);
	const [ownedPatterns, setOwnedPatterns] = useState<OwnedPattern[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [addresses, setAddresses] = useState<Addresses | null>(null);
	const [profile, setProfile] = useState<SocialProfile | null>(null);
	const [isInscribing, setIsInscribing] = useState(false);
	const [isListing, setIsListing] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [pendingThemes, setPendingThemes] = useState<OwnedTheme[]>([]);
	const { availableThemes, setAvailableThemes, resetTheme } = useTheme();

	// Track whether we've fetched data for the current wallet connection
	const hasFetchedRef = useRef(false);

	// Map @1sat/react status to theme-token status
	const status = useMemo<WalletStatus>(() => {
		if (oneSatError) return "error";
		return mapWalletStatus(oneSatStatus);
	}, [oneSatStatus, oneSatError]);

	// Merge errors from @1sat/react and local errors
	const mergedError = useMemo(() => {
		if (error) return error;
		if (oneSatError) return oneSatError.message;
		return null;
	}, [error, oneSatError]);

	// Fetch theme tokens, fonts, and patterns from wallet
	const fetchThemeTokens = useCallback(
		async (w: WalletInterface) => {
			setIsLoading(true);
			setError(null);

			try {
				const ordinals = await getOwnedOrdinals(w);
				const {
					tokens,
					owned,
					fonts,
					patterns,
					hasPrismPass: prismPass,
				} = await categorizeOrdinals(ordinals);

				setHasPrismPass(prismPass);
				setThemeTokens(tokens);
				setOwnedThemes(owned);
				setOwnedFonts(fonts);
				setOwnedPatterns(patterns);
				setAvailableThemes(tokens);
			} catch (err) {
				console.error("[Wallet] Error fetching ordinals:", err);
				setError(
					err instanceof Error ? err.message : "Failed to fetch ordinals",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[setAvailableThemes],
	);

	// Fetch wallet info (addresses, balance)
	const fetchWalletInfo = useCallback(async (w: WalletInterface) => {
		try {
			console.log("[Wallet] Fetching addresses...");
			// Note: spendable balance is intentionally not fetched. The new wallet's
			// main funds basket ("default") is admin-only, so apps cannot read the
			// user's BSV balance. Payment affordability is determined by attempting
			// the payment and surfacing any wallet error (e.g. insufficient funds).
			const [ordAddr, bsvAddr, idKey, social] = await Promise.all([
				getOrdinalAddress(w),
				getPaymentAddress(w),
				getIdentityKey(w),
				getSocialProfile(w),
			]);

			const addrs: Addresses = {
				ordAddress: ordAddr,
				bsvAddress: bsvAddr,
				identityAddress: idKey,
			};
			console.log("[Wallet] Addresses:", addrs);

			setAddresses(addrs);

			// Use the connected wallet's published BAP profile (display name) as the
			// default identity/creator. Null when no profile is published, so the
			// inscribe dialog falls back to "Anonymous" rather than a placeholder.
			setProfile(
				social.displayName
					? { displayName: social.displayName, avatar: social.avatar ?? "" }
					: null,
			);
		} catch (err) {
			console.error("[Wallet] Failed to fetch wallet info:", err);
		}
	}, []);

	// When status transitions to connected and wallet is available, fetch data
	useEffect(() => {
		if (status === "connected" && wallet && !hasFetchedRef.current) {
			hasFetchedRef.current = true;
			fetchThemeTokens(wallet);
			fetchWalletInfo(wallet);
		}

		// Reset when disconnected
		if (status === "disconnected" || status === "not-installed") {
			if (hasFetchedRef.current) {
				hasFetchedRef.current = false;
				setThemeTokens([]);
				setOwnedThemes([]);
				setOwnedFonts([]);
				setOwnedPatterns([]);
				setHasPrismPass(false);
				setAddresses(null);
				setProfile(null);
				setAvailableThemes([]);
				resetTheme();
			}
		}
	}, [
		status,
		wallet,
		fetchThemeTokens,
		fetchWalletInfo,
		setAvailableThemes,
		resetTheme,
	]);

	const connect = useCallback(async () => {
		setError(null);
		try {
			await oneSatConnect();
			// Data fetch will be triggered by the status change effect above
		} catch (err) {
			setError(err instanceof Error ? err.message : "Connection failed");
		}
	}, [oneSatConnect]);

	const disconnect = useCallback(async () => {
		try {
			oneSatDisconnect();
			hasFetchedRef.current = false;
			setThemeTokens([]);
			setOwnedThemes([]);
			setOwnedFonts([]);
			setOwnedPatterns([]);
			setHasPrismPass(false);
			setAddresses(null);
			setProfile(null);
			setAvailableThemes([]);
			resetTheme();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Disconnect failed");
		}
	}, [oneSatDisconnect, setAvailableThemes, resetTheme]);

	const refresh = useCallback(async () => {
		if (status === "connected" && wallet) {
			await fetchThemeTokens(wallet);
			await fetchWalletInfo(wallet);
		}
	}, [status, wallet, fetchThemeTokens, fetchWalletInfo]);

	const inscribeTheme = useCallback(
		async (theme: ThemeToken): Promise<InscribeResponse | null> => {
			if (!wallet || !addresses) {
				setError("Wallet not connected");
				return null;
			}

			setIsInscribing(true);
			setError(null);

			try {
				const jsonString = JSON.stringify(theme);
				const result = await walletInscribeTheme(
					wallet,
					jsonString,
					theme.name,
				);

				// Add to themes cache immediately so it shows up on homepage
				try {
					await fetch("/api/themes/cache", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							txid: result.txid,
							theme,
							owner: addresses.ordAddress,
						}),
					});
				} catch (cacheErr) {
					// Non-fatal - theme will appear once indexed
					console.warn("[Wallet] Failed to update themes cache:", cacheErr);
				}

				await fetchThemeTokens(wallet);
				await fetchWalletInfo(wallet);

				return { txid: result.txid };
			} catch (err) {
				setError(err instanceof Error ? err.message : "Inscription failed");
				return null;
			} finally {
				setIsInscribing(false);
			}
		},
		[wallet, addresses, fetchThemeTokens, fetchWalletInfo],
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
			if (!wallet || !addresses) {
				setError("Wallet not connected");
				return null;
			}

			setIsInscribing(true);
			setError(null);

			try {
				const result = await walletInscribePattern(wallet, svg, metadata);

				await fetchThemeTokens(wallet);
				await fetchWalletInfo(wallet);

				return { txid: result.txid };
			} catch (err) {
				setError(err instanceof Error ? err.message : "Inscription failed");
				return null;
			} finally {
				setIsInscribing(false);
			}
		},
		[wallet, addresses, fetchThemeTokens, fetchWalletInfo],
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
			if (!wallet || !addresses) {
				setError("Wallet not connected");
				return null;
			}

			setIsInscribing(true);
			setError(null);

			try {
				const result = await walletInscribeImage(wallet, base64Data, mimeType, {
					name: metadata?.name,
					aspectRatio: metadata?.aspectRatio,
					style: metadata?.style,
					width: metadata?.dimensions?.width,
					height: metadata?.dimensions?.height,
					prompt: metadata?.prompt,
				});

				await fetchThemeTokens(wallet);
				await fetchWalletInfo(wallet);

				return { txid: result.txid };
			} catch (err) {
				setError(err instanceof Error ? err.message : "Inscription failed");
				return null;
			} finally {
				setIsInscribing(false);
			}
		},
		[wallet, addresses, fetchThemeTokens, fetchWalletInfo],
	);

	const listThemeAction = useCallback(
		async (
			outpoint: string,
			priceSatoshis: number,
		): Promise<ListOrdinalResult | null> => {
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
				const result = await listOrdinal(wallet, { outpoint, priceSatoshis });
				await fetchThemeTokens(wallet);
				await fetchWalletInfo(wallet);
				return result;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Listing failed");
				return null;
			} finally {
				setIsListing(false);
			}
		},
		[wallet, ownedThemes, fetchThemeTokens, fetchWalletInfo],
	);

	const sendPaymentAction = useCallback(
		async (
			recipientAddress: string,
			amountSatoshis: number,
		): Promise<SendBsvResult | null> => {
			if (!wallet) {
				setError("Wallet not connected");
				return null;
			}

			setIsSending(true);
			setError(null);

			try {
				const result = await walletSendPayment(
					wallet,
					recipientAddress,
					amountSatoshis,
				);
				await fetchWalletInfo(wallet);
				return {
					txid: result.txid,
					rawtx: result.rawtx || "",
				};
			} catch (err) {
				setError(err instanceof Error ? err.message : "Payment failed");
				return null;
			} finally {
				setIsSending(false);
			}
		},
		[wallet, fetchWalletInfo],
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
	 * Inscribe multiple items in a single transaction (multi-output bundle).
	 * Uses publishPackage to create a registry package with all items.
	 */
	const inscribeBundle = useCallback(
		async (items: BundleItem[]): Promise<BundleInscribeResult | null> => {
			if (!wallet || !addresses) {
				setError("Wallet not connected");
				return null;
			}

			setIsInscribing(true);
			setError(null);

			try {
				const primaryName = items.find((i) => i.name)?.name || "bundle";
				const { files, metadata } = bundleItemsToPackage(
					items,
					primaryName,
					`Bundle: ${primaryName}`,
				);

				const result = await publishPackage(wallet, files, metadata);

				await fetchThemeTokens(wallet);
				await fetchWalletInfo(wallet);

				const manifestOrigin = result.origins[result.manifestVout];
				return {
					txid: result.txid,
					origins: result.origins,
					manifestOrigin,
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
		[wallet, addresses, fetchThemeTokens, fetchWalletInfo],
	);

	/**
	 * Mint a collection item (e.g., Prism Pass membership NFT).
	 *
	 * The current implementation relies on legacy YoursWallet methods
	 * (getPaymentUtxos, getSignatures, broadcast). These are not available
	 * in the CWI interface.
	 */
	const mintCollectionItem = useCallback(
		async (
			_config: MintCollectionItemConfig,
		): Promise<InscribeResponse | null> => {
			throw new Error(
				"Collection item minting not yet supported via CWI. " +
					"This feature requires migration of mint-collection-item.ts to use @1sat/actions.",
			);
		},
		[],
	);

	return (
		<WalletContext.Provider
			value={{
				status,
				error: mergedError,
				connect,
				disconnect,
				themeTokens,
				ownedThemes,
				ownedFonts,
				ownedPatterns,
				pendingThemes,
				hasPrismPass,
				isLoading,
				refresh,
				addresses,
				profile,
				inscribeTheme,
				inscribePattern,
				inscribeImage,
				isInscribing,
				listTheme: listThemeAction,
				isListing,
				sendPayment: sendPaymentAction,
				isSending,
				addPendingTheme,
				inscribeBundle,
				mintCollectionItem,
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
