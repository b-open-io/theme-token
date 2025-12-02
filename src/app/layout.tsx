import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Theme Token | On-Chain Themes for ShadCN UI",
  description:
    "Install ShadCN themes from blockchain with one command. Create, own, trade, and apply themes across any compatible application.",
  keywords: [
    "theme token",
    "ShadCN themes",
    "ShadCN UI",
    "blockchain themes",
    "1sat ordinals",
    "shadcn registry",
    "NFT themes",
  ],
  metadataBase: new URL("https://themetoken.dev"),
  openGraph: {
    title: "Theme Token | On-Chain Themes for ShadCN UI",
    description: "Install ShadCN themes from blockchain with one command. Create, own, trade, and apply themes across any compatible application.",
    url: "https://themetoken.dev",
    siteName: "Theme Token",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Theme Token - On-Chain Themes for ShadCN UI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Theme Token | On-Chain Themes for ShadCN UI",
    description: "Install ShadCN themes from blockchain with one command",
    images: ["/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
