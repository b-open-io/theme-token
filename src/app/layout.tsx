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
  title: "Theme Token | Tokenize UI Themes on Blockchain",
  description:
    "An open standard for tokenizing ShadCN UI themes as NFT assets. Own, trade, and apply themes across any compatible application.",
  keywords: [
    "theme token",
    "NFT themes",
    "ShadCN UI",
    "blockchain",
    "1sat ordinals",
    "Bitcoin SV",
    "tokenized themes",
  ],
  metadataBase: new URL("https://themetoken.dev"),
  openGraph: {
    title: "Theme Token",
    description: "Tokenize UI Themes on Blockchain",
    url: "https://themetoken.dev",
    siteName: "Theme Token",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Theme Token",
    description: "Tokenize UI Themes on Blockchain",
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
