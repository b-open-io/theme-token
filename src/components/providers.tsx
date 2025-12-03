"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from "@/hooks/use-yours-wallet";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider>
			<WalletProvider>{children}</WalletProvider>
		</ThemeProvider>
	);
}
