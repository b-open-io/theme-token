import { type ThemeToken, validateThemeToken } from "@theme-token/sdk";
import { notFound } from "next/navigation";
import { PreviewClient } from "./preview-client";

interface Props {
  params: Promise<{ origin: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// Fetch theme data on the server
async function getTheme(origin: string): Promise<ThemeToken | null> {
  try {
    const response = await fetch(`https://ordfs.network/${origin}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const result = validateThemeToken(json);

    if (!result.valid) {
      return null;
    }

    return result.theme;
  } catch {
    return null;
  }
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const { origin } = await params;
  const { tab } = await searchParams;

  const theme = await getTheme(origin);

  if (!theme) {
    notFound();
  }

  return <PreviewClient theme={theme} origin={origin} initialTab={tab} />;
}
