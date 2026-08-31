"use client";

import { WalletProvider as OneSatWalletProvider } from "@1sat/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { type ReactNode, useState } from "react";
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
					<BsvRateProvider>
						<MotionConfig reducedMotion="user">{children}</MotionConfig>
					</BsvRateProvider>
				</WalletProvider>
			</OneSatWalletProvider>
		</QueryClientProvider>
	);
}
