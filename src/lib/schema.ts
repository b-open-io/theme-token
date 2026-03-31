import type { Graph, BreadcrumbList } from "schema-dts";

export const SITE_URL = "https://themetoken.dev";
export const SITE_NAME = "Theme Token";

export const IDS = {
  website: `${SITE_URL}/#website`,
  webpage: `${SITE_URL}/#webpage`,
  app: `${SITE_URL}/#softwareapplication`,
  org: "https://bopen.io/#organization",
} as const;

export function breadcrumbs(
  items: { name: string; path: string }[],
): BreadcrumbList {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      ...items.map((item, i) => ({
        "@type": "ListItem" as const,
        position: i + 2,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })),
    ],
  };
}
