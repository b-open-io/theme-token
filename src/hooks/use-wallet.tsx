"use client";

import {
	type WalletStatus as OneSatWalletStatus,
	useWallet as useOneSatWallet,
} from "@1sat/react";
import type { WalletInterface, WalletOutput } from "@bsv/sdk";
import { type ThemeToken, validateThemeToken } from "@theme-token/sdk";
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
import { getPublishedAssetKind } from "@/lib/asset-metadata";
import { type ListOrdinalResult, listOrdinal } from "@/lib/list-ordinal";
import { getOrdfsUrl } from "@/lib/ordfs";
import { bundleItemsToPackage, publishPackage } from "@/lib/package-builder";
// Import and re-export pricing constants
import { PRISM_PASS_COLLECTION_ID, PRISM_PASS_DISCOUNT } from "@/lib/pricing";
import {
	getDepositAddress,
	getIdentityKey,
	getOwnedOrdinals,
	getSocialProfile,
	inscribeImage as walletInscribeImage,
	inscribePattern as walletInscribePattern,
	inscribeTheme as walletInscribeTheme,
	sendPayment as walletSendPayment,
} from "@/lib/wallet-actions";
import {
	type Addresses,
	fetchOrdinalsMetadata,
	type InscribeResponse,
	type SendBsvResult,
	type SocialProfile,
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

/** Result of a theme inscription, including its package directory origin. */
export interface ThemeInscribeResult extends InscribeResponse {
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
	inscribeTheme: (theme: ThemeToken) => Promise<ThemeInscribeResult | null>;
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
	addPendingTheme: (theme: ThemeToken, origin: string) => void;
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
 * Categorization keys off the on-chain MAP `type` (the shadcn `registry:*`
 * value), read from the GorillaPool index — NOT the wallet-local basket tags,
 * which are private metadata that don't survive transfer/purchase. Content is
 * resolved by ORIGIN (stable across transfers) so a purchased package's files
 * still resolve. ORDFS resolves the package's `_N` directory pointers.
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

	// Prism Pass membership is a collection NFT, detected from the basket tags.
	const hasPrismPass = outputs.some((output) =>
		(output.tags ?? []).some((t) => t.includes(PRISM_PASS_COLLECTION_ID)),
	);

	// Read on-chain metadata (origin + MAP type) for every basket ordinal.
	const metas = await fetchOrdinalsMetadata(outputs.map((o) => o.outpoint));

	await Promise.allSettled(
		metas.map(async (meta) => {
			const type = meta.map?.type;
			const assetKind = getPublishedAssetKind(meta.map);
			const { origin, outpoint } = meta;
			const name =
				typeof meta.map?.name === "string" ? meta.map.name : undefined;

			if (type === "registry:style") {
				// Hydrate the theme: ORDFS resolves the `_N` directory ref to the
				// theme.json file. Resolve by origin so transferred packages work.
				const res = await fetch(getOrdfsUrl(`${origin}/theme.json`));
				if (!res.ok) return;
				const validation = validateThemeToken(await res.json());
				if (!validation.valid) return;
				tokens.push(validation.theme);
				owned.push({ theme: validation.theme, outpoint, origin });
			} else if (assetKind === "font") {
				fonts.push({
					outpoint,
					origin,
					metadata: { name: name ?? "Font", weight: "400", style: "normal" },
				});
			} else if (assetKind === "pattern") {
				patterns.push({ outpoint, origin, metadata: { name } });
			}
		}),
	);

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
	const { setAvailableThemes, resetTheme } = useTheme();

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
	const fetchThemeTokens = useCallback(async (w: WalletInterface) => {
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
			// availableThemes (the dropdown) is derived from ownedThemes +
			// pendingThemes by the merge effect below — don't set it here.
		} catch (err) {
			console.error("[Wallet] Error fetching ordinals:", err);
			setError(err instanceof Error ? err.message : "Failed to fetch ordinals");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Fetch wallet info (addresses, balance)
	const fetchWalletInfo = useCallback(async (w: WalletInterface) => {
		try {
			console.log("[Wallet] Fetching addresses...");
			// Note: spendable balance is intentionally not fetched. The new wallet's
			// main funds basket ("default") is admin-only, so apps cannot read the
			// user's BSV balance. Payment affordability is determined by attempting
			// the payment and surfacing any wallet error (e.g. insufficient funds).
			const [depositAddr, idKey, social] = await Promise.all([
				getDepositAddress(w),
				getIdentityKey(w),
				getSocialProfile(w),
			]);

			// One canonical deposit address serves both ordinals and payments in
			// the 1Sat paradigm — they are the same address, matching the wallet.
			const addrs: Addresses = {
				ordAddress: depositAddr,
				bsvAddress: depositAddr,
				identityKey: idKey,
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
			setError(err instanceof Error ? err.message : "Failed to prepare wallet");
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
				setPendingThemes([]);
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

	// Merge indexer-confirmed (ownedThemes) and optimistic (pendingThemes) themes
	// into the dropdown, deduped by origin. A freshly minted/purchased theme is
	// pending until GorillaPool indexes it; once confirmed it drops from pending
	// so it never appears twice.
	useEffect(() => {
		const confirmed = new Set(ownedThemes.map((t) => t.origin));
		const stillPending = pendingThemes.filter((p) => !confirmed.has(p.origin));
		if (stillPending.length !== pendingThemes.length) {
			setPendingThemes(stillPending);
			return;
		}
		setAvailableThemes([
			...ownedThemes.map((t) => t.theme),
			...stillPending.map((p) => p.theme),
		]);
	}, [ownedThemes, pendingThemes, setAvailableThemes]);

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
		async (theme: ThemeToken): Promise<ThemeInscribeResult | null> => {
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

				// Optimistic ownership: we just minted it, so surface it instantly
				// without waiting on the indexer. The merge effect dedupes it once
				// GorillaPool confirms the same origin (the manifest directory).
				const mintedOrigin = `${result.txid}_${result.manifestVout}`;
				setPendingThemes((prev) =>
					prev.some((p) => p.origin === mintedOrigin)
						? prev
						: [
								...prev,
								{ theme, outpoint: mintedOrigin, origin: mintedOrigin },
							],
				);

				// Add to themes cache immediately so it shows up on homepage
				try {
					await fetch("/api/themes/cache", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							origin: mintedOrigin,
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

				return { txid: result.txid, manifestOrigin: mintedOrigin };
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

	// Add a theme to pending state (optimistic ownership before the indexer
	// confirms). `origin` is the theme's stable origin outpoint — the same key
	// GorillaPool reports — so the merge effect dedupes once it's indexed. The
	// dropdown updates via that effect, not here.
	const addPendingTheme = useCallback((theme: ThemeToken, origin: string) => {
		setPendingThemes((prev) =>
			prev.some((p) => p.origin === origin)
				? prev
				: [...prev, { theme, outpoint: origin, origin }],
		);
	}, []);

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
				const primaryItem = items[items.length - 1];
				const primaryName =
					primaryItem?.metadata?.displayName ||
					primaryItem?.name?.replace(/\.[^.]+$/, "") ||
					"bundle";
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
	 * This flow needs an issuer-authorized BRC-100 design before it can be enabled.
	 */
	const mintCollectionItem = useCallback(
		async (
			_config: MintCollectionItemConfig,
		): Promise<InscribeResponse | null> => {
			throw new Error("Collection item minting is not available yet.");
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
