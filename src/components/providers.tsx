"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { BsvRateProvider } from "@/hooks/use-bsv-rate-context";
import { WalletProvider } from "@/hooks/use-yours-wallet";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider>
			<WalletProvider>
				<BsvRateProvider>{children}</BsvRateProvider>
			</WalletProvider>
		</ThemeProvider>
	);
}
