import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Theme Token Specification | JSON Schema for ShadCN Themes",
  description:
    "Technical specification for the Theme Token JSON schema. Learn how to structure theme data for ShadCN UI components.",
  openGraph: {
    title: "Theme Token Specification",
    description: "Technical specification for the Theme Token JSON schema.",
  },
};

export default function SpecLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
