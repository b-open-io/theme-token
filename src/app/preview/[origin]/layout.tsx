import type { Metadata } from "next";
import { fetchThemeByOrigin } from "@/lib/fetch-themes";

interface Props {
  params: Promise<{ origin: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { origin } = await params;

  // Try to fetch theme name for title
  let themeName = "Theme Preview";
  try {
    const published = await fetchThemeByOrigin(origin);
    if (published) {
      themeName = published.theme.name;
    }
  } catch {
    // Use default name
  }

  return {
    title: `${themeName} | Theme Token`,
    description: `Preview and install the ${themeName} theme for ShadCN UI`,
    openGraph: {
      title: `${themeName} | Theme Token`,
      description: `Preview and install the ${themeName} theme for ShadCN UI`,
      images: [
        {
          url: `/og/${origin}.png`,
          width: 1200,
          height: 630,
          alt: `${themeName} - Theme Token`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${themeName} | Theme Token`,
      description: `Preview and install the ${themeName} theme`,
      images: [`/og/${origin}.png`],
    },
  };
}

export default function PreviewLayout({ children }: Props) {
  return children;
}
