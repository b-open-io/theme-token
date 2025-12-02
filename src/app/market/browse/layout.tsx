import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Themes | Theme Token Market",
  description:
    "Browse and buy on-chain ShadCN themes. Find unique color schemes and typography combinations inscribed on blockchain.",
  openGraph: {
    title: "Browse Themes | Theme Token Market",
    description: "Browse and buy on-chain ShadCN themes from creators worldwide.",
  },
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
