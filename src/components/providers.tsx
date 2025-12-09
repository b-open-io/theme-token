"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { BsvRateProvider } from "@/hooks/use-bsv-rate-context";
import { WalletProvider } from "@/hooks/use-yours-wallet";

export function Providers({ children }: { children: ReactNode }) {
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
			<ThemeProvider>
				<WalletProvider>
					<BsvRateProvider>{children}</BsvRateProvider>
				</WalletProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
