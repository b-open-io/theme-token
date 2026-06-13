"use client";

import { WalletProvider as OneSatWalletProvider } from "@1sat/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { BsvRateProvider } from "@/hooks/use-bsv-rate-context";
import { WalletProvider } from "@/hooks/use-yours-wallet";

interface ProvidersProps {
	children: ReactNode;
	/** Theme origin from SSR session */
	initialThemeOrigin?: string | null;
	/** Whether user already has a session cookie */
	hasExistingSession?: boolean;
}

export function Providers({
	children,
	initialThemeOrigin,
	hasExistingSession,
}: ProvidersProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000, // 1 minute
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider
				initialThemeOrigin={initialThemeOrigin}
				hasExistingSession={hasExistingSession}
			>
				<OneSatWalletProvider
					autoDetect
					providers={[
						{
							type: "onesat",
							name: "1Sat Wallet",
							url: "https://1satwallet.com",
						},
					]}
				>
					<WalletProvider>
						<BsvRateProvider>{children}</BsvRateProvider>
					</WalletProvider>
				</OneSatWalletProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
