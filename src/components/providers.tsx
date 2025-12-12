"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
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
				<WalletProvider>
					<BsvRateProvider>{children}</BsvRateProvider>
				</WalletProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
