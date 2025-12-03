"use client";

import { type ThemeToken, validateThemeToken } from "@theme-token/sdk";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { useTheme } from "@/components/theme-provider";
import { type ListOrdinalResult, listOrdinal } from "@/lib/list-ordinal";
import {
	type Addresses,
	type Balance,
	getYoursWallet,
	type InscribeResponse,
	isYoursWalletInstalled,
	type Ordinal,
	sendBsv,
	type SendBsvResult,
	type SocialProfile,
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

interface WalletContextValue {
	status: WalletStatus;
	error: string | null;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	themeTokens: ThemeToken[];
	ownedThemes: OwnedTheme[];
	isLoading: boolean;
	refresh: () => Promise<void>;
	addresses: Addresses | null;
	balance: Balance | null;
	profile: SocialProfile | null;
	inscribeTheme: (theme: ThemeToken) => Promise<InscribeResponse | null>;
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
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<WalletStatus>("disconnected");
	const [error, setError] = useState<string | null>(null);
	const [themeTokens, setThemeTokens] = useState<ThemeToken[]>([]);
	const [ownedThemes, setOwnedThemes] = useState<OwnedTheme[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [addresses, setAddresses] = useState<Addresses | null>(null);
	const [balance, setBalance] = useState<Balance | null>(null);
	const [profile, setProfile] = useState<SocialProfile | null>(null);
	const [isInscribing, setIsInscribing] = useState(false);
	const [isListing, setIsListing] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const walletRef = useRef<YoursWallet | null>(null);
	const { setAvailableThemes, resetTheme } = useTheme();

	// Fetch theme tokens from wallet
	const fetchThemeTokens = useCallback(async () => {
		const wallet = walletRef.current;
		if (!wallet) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await wallet.getOrdinals({ limit: 100 });
			const tokens: ThemeToken[] = [];
			const owned: OwnedTheme[] = [];
			const ordinals = Array.isArray(response)
				? response
				: (response?.ordinals ?? []);

			for (const ordinal of ordinals) {
				try {
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
					setError(err instanceof Error ? err.message : "Connection check failed");
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

				const response = await wallet.inscribe([
					{
						address: addresses.ordAddress,
						base64Data,
						mimeType: "application/json",
						map: {
							app: "ThemeToken",
							type: "theme",
							name: theme.name,
						},
						satoshis: 1,
					},
				]);

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

	return (
		<WalletContext.Provider
			value={{
				status,
				error,
				connect,
				disconnect,
				themeTokens,
				ownedThemes,
				isLoading,
				refresh,
				addresses,
				balance,
				profile,
				inscribeTheme,
				isInscribing,
				listTheme,
				isListing,
				sendPayment,
				isSending,
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
