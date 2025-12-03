# On-Chain Font Integration for Theme Token

## Executive Summary

This plan details a comprehensive integration of on-chain fonts into the theme-token system, enabling fonts to be inscribed as ordinals, traded on a marketplace, and referenced within themes for rendering via ORDFS.

---

## Phase 1: Schema Extension (SDK Changes)

### 1.1 Font Reference Design Decision

**Recommended Approach: Parallel Origin Properties**

Add optional `-origin` properties alongside existing font-family strings:

```typescript
interface ThemeStyleProps {
  // Existing (Google Fonts / local fonts)
  "font-sans"?: string;      // e.g., '"Inter", system-ui, sans-serif'
  "font-serif"?: string;
  "font-mono"?: string;
  
  // NEW: On-chain font origins (optional)
  "font-sans-origin"?: string;   // e.g., "abc123def456_0"
  "font-serif-origin"?: string;
  "font-mono-origin"?: string;
}
```

**Rationale:**
- Backward compatible - existing themes continue to work
- Simple string values matching existing schema pattern
- Clear precedence: if origin exists, load from chain; otherwise use font-family string
- Avoids complex nested objects that would break zod schema
- Easy to validate with existing zod string validators

**Alternative Considered (Rejected):**
```typescript
// Object approach - more complex, breaks existing patterns
"font-sans": { 
  origin?: string;
  family: string;  // fallback if origin fails
}
```
This would require schema migration and break backward compatibility.

### 1.2 Schema Changes

**File: `/Users/satchmo/code/theme-token/public/v1/schema.json`**

Add to `themeStyleProps`:
```json
{
  "font-sans-origin": { 
    "type": "string", 
    "description": "Ordinal origin for on-chain sans font (txid_vout format)",
    "pattern": "^[a-f0-9]{64}_\\d+$"
  },
  "font-serif-origin": { 
    "type": "string", 
    "description": "Ordinal origin for on-chain serif font" 
  },
  "font-mono-origin": { 
    "type": "string", 
    "description": "Ordinal origin for on-chain monospace font" 
  }
}
```

**File: `@theme-token/sdk` (external package)**

Extend the schema with optional origin properties:
```typescript
const fontOriginRegex = /^[a-f0-9]{64}_\d+$/;

const themeStylePropsSchema = corePropsSchema.extend({
  "font-sans-origin": z.string().regex(fontOriginRegex).optional(),
  "font-serif-origin": z.string().regex(fontOriginRegex).optional(),
  "font-mono-origin": z.string().regex(fontOriginRegex).optional(),
}).catchall(z.string());
```

### 1.3 SDK Font Types

**New file in SDK: `fonts.ts`**

```typescript
/**
 * Font Token - inscribed font ordinal metadata
 */
export interface FontToken {
  origin: string;           // txid_vout
  name: string;            // Font family name
  weight: string;          // e.g., "400", "400;700"
  style: "normal" | "italic";
  format: "woff2" | "woff" | "ttf";
  license: string;
  author?: string;
  aiGenerated: boolean;
  glyphCount?: number;
}

/**
 * Font inscription MAP metadata (matches existing inscription format)
 */
export interface FontInscriptionMap {
  app: "theme-token";
  type: "font";
  name: string;
  weight: string;
  style: string;
  author?: string;
  license: string;
  website?: string;
  aiGenerated?: "true" | "false";
  glyphCount?: string;
}

/**
 * Validate font inscription MAP data
 */
export function validateFontMap(map: unknown): map is FontInscriptionMap;

/**
 * Parse font metadata from ordinal data
 */
export function parseFontToken(ordinal: OrdinalData): FontToken | null;
```

---

## Phase 2: Font Loading System (SDK + Web App)

### 2.1 ORDFS Font Loader

**New file: `/Users/satchmo/code/theme-token/src/lib/font-loader.ts`**

```typescript
// Cache for loaded on-chain fonts
const loadedFontOrigins = new Set<string>();
const fontCache = new Map<string, FontFace>();

/**
 * Build ORDFS URL for font content
 */
export function getOrdfsFontUrl(origin: string): string {
  return `https://ordfs.network/content/${origin}`;
}

/**
 * Load a font from ORDFS and register as @font-face
 */
export async function loadOnChainFont(
  origin: string,
  fontFamily: string,
  options?: {
    weight?: string;
    style?: string;
  }
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (loadedFontOrigins.has(origin)) return true;

  try {
    const url = getOrdfsFontUrl(origin);
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = await response.arrayBuffer();
    const font = new FontFace(fontFamily, buffer, {
      weight: options?.weight || "400",
      style: options?.style || "normal",
    });

    await font.load();
    document.fonts.add(font);
    loadedFontOrigins.add(origin);
    fontCache.set(origin, font);

    return true;
  } catch (error) {
    console.error(`[FontLoader] Failed to load font ${origin}:`, error);
    return false;
  }
}

/**
 * Generate unique font family name for on-chain font
 */
export function getOnChainFontFamily(origin: string, baseName?: string): string {
  const shortOrigin = origin.slice(0, 8);
  return baseName ? `${baseName}-${shortOrigin}` : `OnChain-${shortOrigin}`;
}

/**
 * Load all on-chain fonts referenced by a theme
 */
export async function loadThemeOnChainFonts(theme: ThemeToken): Promise<void> {
  const promises: Promise<boolean>[] = [];
  
  for (const mode of ["light", "dark"] as const) {
    const styles = theme.styles[mode];
    
    // Load font-sans-origin
    if (styles["font-sans-origin"]) {
      const family = getOnChainFontFamily(styles["font-sans-origin"], "Sans");
      promises.push(loadOnChainFont(styles["font-sans-origin"], family));
    }
    
    // Load font-serif-origin
    if (styles["font-serif-origin"]) {
      const family = getOnChainFontFamily(styles["font-serif-origin"], "Serif");
      promises.push(loadOnChainFont(styles["font-serif-origin"], family));
    }
    
    // Load font-mono-origin
    if (styles["font-mono-origin"]) {
      const family = getOnChainFontFamily(styles["font-mono-origin"], "Mono");
      promises.push(loadOnChainFont(styles["font-mono-origin"], family));
    }
  }
  
  await Promise.allSettled(promises);
}
```

### 2.2 Integrate with Existing Font System

**File: `/Users/satchmo/code/theme-token/src/lib/fonts.ts`** - Extend `loadThemeFonts`

```typescript
import { loadThemeOnChainFonts, getOnChainFontFamily } from "./font-loader";

export async function loadThemeFonts(theme: ThemeToken): Promise<void> {
  // Load Google Fonts (existing logic)
  const fontKeys = ["font-sans", "font-serif", "font-mono"] as const;
  
  for (const key of fontKeys) {
    for (const mode of ["light", "dark"] as const) {
      const value = theme.styles[mode][key];
      if (!value) continue;
      
      const fontName = extractFontFamily(value);
      if (fontName && isGoogleFont(fontName)) {
        loadGoogleFont(fontName);
      }
    }
  }
  
  // NEW: Load on-chain fonts
  await loadThemeOnChainFonts(theme);
}
```

### 2.3 CSS Variable Application

**File: `/Users/satchmo/code/theme-token/src/lib/font-loader.ts`** - Add CSS injection

When applying a theme with font origins, update CSS variables to reference the loaded font:

```typescript
import { SYSTEM_FONTS } from "./fonts";

export function applyOnChainFontVars(theme: ThemeToken, mode: "light" | "dark"): void {
  const styles = theme.styles[mode];
  const root = document.documentElement;
  
  if (styles["font-sans-origin"]) {
    const family = getOnChainFontFamily(styles["font-sans-origin"], "Sans");
    root.style.setProperty("--font-sans", `"${family}", ${SYSTEM_FONTS.sans}`);
  }
  
  if (styles["font-serif-origin"]) {
    const family = getOnChainFontFamily(styles["font-serif-origin"], "Serif");
    root.style.setProperty("--font-serif", `"${family}", ${SYSTEM_FONTS.serif}`);
  }
  
  if (styles["font-mono-origin"]) {
    const family = getOnChainFontFamily(styles["font-mono-origin"], "Mono");
    root.style.setProperty("--font-mono", `"${family}", ${SYSTEM_FONTS.mono}`);
  }
}
```

---

## Phase 3: Font Marketplace

### 3.1 Market Structure Extension

**File: `/Users/satchmo/code/theme-token/src/lib/yours-wallet.ts`** - Add font market types and fetchers

```typescript
export interface FontMarketListing {
  outpoint: string;
  origin: string;
  price: number;
  owner: string;
  font: FontToken;
}

/**
 * Fetch font listings from marketplace
 */
export async function fetchFontMarketListings(): Promise<FontMarketListing[]> {
  const response = await fetch(
    `${ORDINALS_API}/market?limit=100&dir=DESC&type=font/woff2`
  );
  
  if (!response.ok) return [];
  
  const results = await response.json();
  const fontListings: FontMarketListing[] = [];
  
  // Filter for theme-token fonts by MAP metadata
  const potentialFonts = results.filter(
    (item: any) => item.origin?.data?.map?.app === "theme-token" &&
                   item.origin?.data?.map?.type === "font"
  );
  
  for (const item of potentialFonts) {
    const mapData = item.origin?.data?.map;
    if (!mapData) continue;
    
    fontListings.push({
      outpoint: item.outpoint,
      origin: item.origin?.outpoint || item.outpoint,
      price: item.data?.list?.price || 0,
      owner: item.owner,
      font: {
        origin: item.origin?.outpoint,
        name: mapData.name,
        weight: mapData.weight || "400",
        style: mapData.style as "normal" | "italic" || "normal",
        format: "woff2",
        license: mapData.license || "Unknown",
        author: mapData.author,
        aiGenerated: mapData.aiGenerated === "true",
        glyphCount: mapData.glyphCount ? parseInt(mapData.glyphCount) : undefined,
      },
    });
  }
  
  return fontListings;
}
```

### 3.2 Market Layout Update

**File: `/Users/satchmo/code/theme-token/src/app/market/layout.tsx`**

Add "Fonts" tab to the marketplace navigation:

```typescript
import { Type } from "lucide-react";

const tabs = [
  { href: "/market/browse", label: "Themes", icon: ShoppingCart },
  { href: "/market/fonts", label: "Fonts", icon: Type },  // NEW
  { href: "/market/my-themes", label: "My Items", icon: Wallet },
  { href: "/market/sell", label: "Sell", icon: Tag },
];
```

### 3.3 Font Browse Page

**New file: `/Users/satchmo/code/theme-token/src/app/market/fonts/page.tsx`**

```typescript
"use client";

import { motion } from "framer-motion";
import { Loader2, RefreshCw, Type } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import { fetchFontMarketListings, type FontMarketListing } from "@/lib/yours-wallet";
import { FontCard } from "@/components/market/font-card";
import { FontFilterSidebar, type FontFilterState } from "@/components/market/font-filter-sidebar";

const DEFAULT_FILTERS: FontFilterState = {
  weights: [],
  styles: [],
  licenses: [],
  aiGenerated: null,
  priceRange: [0, 10],
};

export default function FontsPage() {
  const { status, connect } = useYoursWallet();
  const [listings, setListings] = useState<FontMarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FontFilterState>(DEFAULT_FILTERS);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  
  const isConnected = status === "connected";
  
  async function loadListings() {
    setIsLoading(true);
    try {
      const data = await fetchFontMarketListings();
      setListings(data);
    } finally {
      setIsLoading(false);
    }
  }
  
  useEffect(() => {
    loadListings();
  }, []);
  
  // Filter listings based on filters
  const filteredListings = useMemo(() => {
    let result = [...listings];
    
    if (filters.weights.length > 0) {
      result = result.filter((l) => filters.weights.includes(l.font.weight));
    }
    
    if (filters.licenses.length > 0) {
      result = result.filter((l) => filters.licenses.includes(l.font.license));
    }
    
    if (filters.aiGenerated !== null) {
      result = result.filter((l) => l.font.aiGenerated === filters.aiGenerated);
    }
    
    result = result.filter((l) => {
      const priceInBsv = l.price / 100_000_000;
      return priceInBsv <= filters.priceRange[1];
    });
    
    return result;
  }, [listings, filters]);
  
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Sidebar */}
      <aside className="hidden lg:block lg:col-span-3 xl:col-span-2">
        <div className="sticky top-28">
          <FontFilterSidebar filters={filters} onFiltersChange={setFilters} />
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="lg:col-span-9 xl:col-span-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">On-Chain Fonts</h2>
            <p className="text-sm text-muted-foreground">
              {filteredListings.length} font{filteredListings.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadListings} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.outpoint}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FontCard
                  listing={listing}
                  isConnected={isConnected}
                  isPurchasing={purchasing === listing.outpoint}
                  onPurchase={() => {/* purchase logic */}}
                  onConnect={connect}
                />
              </motion.div>
            ))}
          </div>
        )}
        
        {!isLoading && listings.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <Type className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mb-2 text-lg font-semibold">No fonts available</h3>
            <p className="text-muted-foreground">Be the first to inscribe a font!</p>
          </div>
        )}
      </main>
    </div>
  );
}
```

### 3.4 Font Card Component

**New file: `/Users/satchmo/code/theme-token/src/components/market/font-card.tsx`**

```typescript
"use client";

import { ExternalLink, Loader2, ShoppingCart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBsvRateContext } from "@/hooks/use-bsv-rate-context";
import { loadOnChainFont } from "@/lib/font-loader";
import type { FontMarketListing } from "@/lib/yours-wallet";
import { formatBSV } from "./theme-stripes";

interface FontCardProps {
  listing: FontMarketListing;
  isConnected: boolean;
  isPurchasing: boolean;
  onPurchase: () => void;
  onConnect: () => void;
}

export function FontCard({
  listing,
  isConnected,
  isPurchasing,
  onPurchase,
  onConnect,
}: FontCardProps) {
  const { font, price, origin } = listing;
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const fontFamily = `preview-${origin.slice(0, 8)}`;
  const { formatUsd } = useBsvRateContext();
  const usdPrice = formatUsd(price);
  
  // Load font for preview on hover
  const handleMouseEnter = async () => {
    if (!previewLoaded) {
      const success = await loadOnChainFont(origin, fontFamily);
      if (success) setPreviewLoaded(true);
    }
  };
  
  return (
    <div className="group flex flex-col gap-3" onMouseEnter={handleMouseEnter}>
      {/* Preview Area */}
      <div className="aspect-[4/3] rounded-xl border bg-card p-6 flex flex-col justify-center">
        <div 
          style={{ fontFamily: previewLoaded ? `"${fontFamily}", system-ui` : "system-ui" }}
          className="space-y-2 text-center transition-all"
        >
          <p className="text-4xl font-medium">Aa Bb Cc</p>
          <p className="text-lg text-muted-foreground">
            The quick brown fox jumps over the lazy dog
          </p>
          <p className="text-sm text-muted-foreground/60">
            0123456789 !@#$%^&amp;*()
          </p>
        </div>
        
        {/* Loading indicator */}
        {!previewLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      
      {/* Metadata */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate">{font.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="outline" className="text-[10px]">{font.weight}</Badge>
            <Badge variant="outline" className="text-[10px]">{font.license}</Badge>
            {font.aiGenerated && (
              <Badge className="text-[10px]">
                <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                AI
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {font.author || "Anonymous"} &middot; <span className="font-mono">{origin.slice(0, 8)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold">
            {usdPrice || `${formatBSV(price)} BSV`}
          </p>
          {usdPrice && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatBSV(price)} BSV
            </span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/preview/font/${origin}`}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Details
          </Link>
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={isPurchasing}
          onClick={() => (isConnected ? onPurchase() : onConnect())}
        >
          {isPurchasing ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Buying...
            </>
          ) : !isConnected ? (
            "Connect"
          ) : (
            <>
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              Buy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
```

### 3.5 Font Filter Sidebar

**New file: `/Users/satchmo/code/theme-token/src/components/market/font-filter-sidebar.tsx`**

```typescript
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export interface FontFilterState {
  weights: string[];
  styles: ("normal" | "italic")[];
  licenses: string[];
  aiGenerated: boolean | null;
  priceRange: [number, number];
}

interface FontFilterSidebarProps {
  filters: FontFilterState;
  onFiltersChange: (filters: FontFilterState) => void;
  maxPrice?: number;
}

const WEIGHT_OPTIONS = ["300", "400", "500", "600", "700", "800"];
const LICENSE_OPTIONS = ["CC0_1.0", "SIL_OFL_1.1", "MIT", "APACHE_2.0", "CC_BY_4.0"];

export function FontFilterSidebar({
  filters,
  onFiltersChange,
  maxPrice = 10,
}: FontFilterSidebarProps) {
  const toggleWeight = (weight: string) => {
    const newWeights = filters.weights.includes(weight)
      ? filters.weights.filter((w) => w !== weight)
      : [...filters.weights, weight];
    onFiltersChange({ ...filters, weights: newWeights });
  };
  
  const toggleLicense = (license: string) => {
    const newLicenses = filters.licenses.includes(license)
      ? filters.licenses.filter((l) => l !== license)
      : [...filters.licenses, license];
    onFiltersChange({ ...filters, licenses: newLicenses });
  };
  
  return (
    <div className="space-y-6">
      {/* Weight Filter */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Weight</h4>
        <div className="space-y-2">
          {WEIGHT_OPTIONS.map((weight) => (
            <label key={weight} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.weights.includes(weight)}
                onCheckedChange={() => toggleWeight(weight)}
              />
              <span className="text-sm">{weight}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* License Filter */}
      <div>
        <h4 className="mb-3 text-sm font-medium">License</h4>
        <div className="space-y-2">
          {LICENSE_OPTIONS.map((license) => (
            <label key={license} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.licenses.includes(license)}
                onCheckedChange={() => toggleLicense(license)}
              />
              <span className="text-sm">{license.replace(/_/g, " ")}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* AI Filter */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Origin</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="aiFilter"
              checked={filters.aiGenerated === null}
              onChange={() => onFiltersChange({ ...filters, aiGenerated: null })}
              className="h-4 w-4"
            />
            <span className="text-sm">All fonts</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="aiFilter"
              checked={filters.aiGenerated === false}
              onChange={() => onFiltersChange({ ...filters, aiGenerated: false })}
              className="h-4 w-4"
            />
            <span className="text-sm">Human designed</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="aiFilter"
              checked={filters.aiGenerated === true}
              onChange={() => onFiltersChange({ ...filters, aiGenerated: true })}
              className="h-4 w-4"
            />
            <span className="text-sm">AI generated</span>
          </label>
        </div>
      </div>
      
      {/* Price Range */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium">Max Price</h4>
          <span className="font-mono text-sm text-muted-foreground">
            {filters.priceRange[1].toFixed(2)} BSV
          </span>
        </div>
        <Slider
          value={[filters.priceRange[1]]}
          min={0}
          max={maxPrice}
          step={0.01}
          onValueChange={([value]) =>
            onFiltersChange({ ...filters, priceRange: [0, value] })
          }
        />
      </div>
    </div>
  );
}
```

### 3.6 My Fonts Page (Extend My Themes)

**File: `/Users/satchmo/code/theme-token/src/app/market/my-themes/page.tsx`**

Rename to "My Items" and add fonts section, OR create new `/src/app/market/my-fonts/page.tsx`:

```typescript
"use client";

import { motion } from "framer-motion";
import { Eye, Tag, Type, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useYoursWallet } from "@/hooks/use-yours-wallet";

export default function MyFontsPage() {
  const { status, connect, ownedFonts } = useYoursWallet();
  
  const isConnected = status === "connected";
  
  if (!isConnected) {
    return (
      <div className="rounded-xl border border-dashed border-border py-20 text-center">
        <Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mb-2 text-lg font-semibold">Connect Your Wallet</h3>
        <p className="mb-4 text-muted-foreground">Connect to see your font tokens</p>
        <Button onClick={connect}>Connect Wallet</Button>
      </div>
    );
  }
  
  if (ownedFonts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-20 text-center">
        <Type className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mb-2 text-lg font-semibold">No fonts found</h3>
        <p className="mb-4 text-muted-foreground">You don&apos;t own any font tokens yet</p>
        <div className="flex gap-3 justify-center">
          <Link href="/studio/font">
            <Button>Inscribe a Font</Button>
          </Link>
          <Link href="/market/fonts">
            <Button variant="outline">Browse Fonts</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">My Font Tokens</h2>
        <p className="text-muted-foreground">
          Font tokens you own that can be used in themes or listed for sale
        </p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ownedFonts.map((owned, i) => (
          <motion.div
            key={owned.outpoint}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-1">
                <Badge variant="outline">{owned.font.weight}</Badge>
                <Badge variant="outline">{owned.font.license}</Badge>
              </div>
              <Badge variant="outline">Owned</Badge>
            </div>
            <h3 className="mb-1 font-semibold">{owned.font.name}</h3>
            <p className="mb-4 truncate font-mono text-[10px] text-muted-foreground">
              {owned.origin}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/preview/font/${owned.origin}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href="/market/sell">
                  <Tag className="mr-2 h-4 w-4" />
                  Sell
                </Link>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 4: Theme Studio Font Integration

### 4.1 Font Source Toggle

**File: `/Users/satchmo/code/theme-token/src/components/theme-studio.tsx`** - Typography sub-tab

Replace the current text inputs with a hybrid selector. Around line 902-1024, modify the typography section:

```typescript
{editorSubTab === "typography" && (
  <div className="space-y-4">
    {/* Font Selector for each type */}
    {(["sans", "serif", "mono"] as const).map((fontType) => (
      <FontSelector
        key={fontType}
        label={fontType}
        mode={mode}
        fontFamily={selectedTheme.styles[mode][`font-${fontType}`]}
        fontOrigin={selectedTheme.styles[mode][`font-${fontType}-origin`]}
        onFamilyChange={(v) => updateColor(`font-${fontType}`, v)}
        onOriginChange={(v) => updateColor(`font-${fontType}-origin`, v)}
      />
    ))}
    
    {/* Keep existing letter-spacing and spacing sliders */}
    {/* ... */}
  </div>
)}
```

### 4.2 Font Selector Component

**New file: `/Users/satchmo/code/theme-token/src/components/font-selector.tsx`**

```typescript
"use client";

import { motion } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useYoursWallet } from "@/hooks/use-yours-wallet";
import {
  FONT_CATALOG,
  SYSTEM_FONTS,
  buildFontFamily,
  extractFontFamily,
  isGoogleFont,
} from "@/lib/fonts";
import { loadOnChainFont, getOnChainFontFamily } from "@/lib/font-loader";
import { fetchFontMarketListings, type FontMarketListing } from "@/lib/yours-wallet";

interface FontSelectorProps {
  label: "sans" | "serif" | "mono";
  mode: "light" | "dark";
  fontFamily?: string;
  fontOrigin?: string;
  onFamilyChange: (value: string) => void;
  onOriginChange: (value: string | undefined) => void;
}

type FontSource = "google" | "onchain" | "custom";

export function FontSelector({
  label,
  fontFamily,
  fontOrigin,
  onFamilyChange,
  onOriginChange,
}: FontSelectorProps) {
  const { ownedFonts } = useYoursWallet();
  const [marketFonts, setMarketFonts] = useState<FontMarketListing[]>([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  
  // Determine current source
  const currentSource: FontSource = fontOrigin 
    ? "onchain" 
    : (fontFamily && isGoogleFont(extractFontFamily(fontFamily) || ""))
      ? "google"
      : fontFamily
        ? "custom"
        : "google";
  
  const [source, setSource] = useState<FontSource>(currentSource);
  
  // Load market fonts when switching to on-chain
  useEffect(() => {
    if (source === "onchain" && marketFonts.length === 0) {
      setIsLoadingMarket(true);
      fetchFontMarketListings()
        .then((listings) => setMarketFonts(listings.slice(0, 10)))
        .finally(() => setIsLoadingMarket(false));
    }
  }, [source, marketFonts.length]);
  
  // Handle source change
  const handleSourceChange = (newSource: FontSource) => {
    setSource(newSource);
    if (newSource !== "onchain") {
      onOriginChange(undefined);
    }
  };
  
  // Handle on-chain font selection
  const handleOnChainSelect = async (origin: string, fontName: string) => {
    // Load the font first
    const family = getOnChainFontFamily(origin, label);
    await loadOnChainFont(origin, family);
    
    // Update both origin and family (family as fallback display)
    onOriginChange(origin);
    onFamilyChange(`"${family}", ${SYSTEM_FONTS[label]}`);
  };
  
  const labelText = {
    sans: "Sans-Serif (--font-sans)",
    serif: "Serif (--font-serif)",
    mono: "Monospace (--font-mono)",
  }[label];
  
  return (
    <div className="rounded-lg border border-border p-3">
      {/* Header with label and source toggle */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {labelText}
        </span>
        
        {/* Source Toggle */}
        <div className="flex gap-0.5 rounded bg-muted/50 p-0.5">
          {(["google", "onchain", "custom"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSourceChange(s)}
              className={`relative rounded px-2 py-1 text-[10px] transition-colors ${
                source === s ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              {source === s && (
                <motion.div
                  layoutId={`font-source-${label}`}
                  className="absolute inset-0 rounded bg-background shadow-sm"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">
                {s === "google" ? "Google" : s === "onchain" ? "On-Chain" : "Custom"}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Google Font Picker */}
      {source === "google" && (
        <Select
          value={extractFontFamily(fontFamily || "") || ""}
          onValueChange={(v) => onFamilyChange(buildFontFamily(v, label))}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select a font..." />
          </SelectTrigger>
          <SelectContent>
            {FONT_CATALOG[label].map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {/* On-Chain Font Picker */}
      {source === "onchain" && (
        <div className="space-y-3">
          {/* Owned fonts */}
          {ownedFonts.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-medium text-muted-foreground">
                My Fonts
              </div>
              <div className="space-y-1">
                {ownedFonts.map((owned) => (
                  <button
                    key={owned.origin}
                    type="button"
                    onClick={() => handleOnChainSelect(owned.origin, owned.font.name)}
                    className={`w-full flex items-center justify-between rounded border px-2 py-1.5 text-left transition-colors ${
                      fontOrigin === owned.origin
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-xs font-medium">{owned.font.name}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {owned.font.weight}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Market fonts */}
          {marketFonts.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">
                  Available on Market
                </span>
                <Link 
                  href="/market/fonts" 
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                >
                  Browse all <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              </div>
              {isLoadingMarket ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1">
                  {marketFonts.map((listing) => (
                    <div
                      key={listing.origin}
                      className="flex items-center justify-between rounded border border-border px-2 py-1.5"
                    >
                      <span className="text-xs">{listing.font.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {(listing.price / 100_000_000).toFixed(4)} BSV
                        </span>
                        <Link href={`/market/fonts`}>
                          <Badge variant="outline" className="text-[9px] cursor-pointer">
                            Buy
                          </Badge>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Manual origin input */}
          <div className="border-t border-border pt-3">
            <label className="block text-[10px] text-muted-foreground mb-1">
              Or enter origin manually:
            </label>
            <input
              type="text"
              value={fontOrigin || ""}
              onChange={(e) => {
                const value = e.target.value.trim();
                onOriginChange(value || undefined);
                if (value) {
                  // Generate a family name from origin
                  const family = getOnChainFontFamily(value, label);
                  onFamilyChange(`"${family}", ${SYSTEM_FONTS[label]}`);
                }
              }}
              placeholder="abc123...def456_0"
              className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      )}
      
      {/* Custom Font Family Input */}
      {source === "custom" && (
        <input
          type="text"
          value={fontFamily || ""}
          onChange={(e) => onFamilyChange(e.target.value)}
          placeholder={`"CustomFont", ${SYSTEM_FONTS[label]}`}
          className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
        />
      )}
    </div>
  );
}
```

---

## Phase 5: Font Registry Endpoint

### 5.1 Font Registry JSON Route

**New file: `/Users/satchmo/code/theme-token/src/app/r/fonts/[origin]/route.ts`**

```typescript
import { NextResponse } from "next/server";

const ORDINALS_API = "https://ordinals.gorillapool.io/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ origin: string }> },
) {
  try {
    const { origin } = await params;
    const cleanOrigin = origin.replace(/\.json$/, "").replace(/\.css$/, "");
    
    // Fetch ordinal metadata
    const metaResponse = await fetch(
      `${ORDINALS_API}/inscriptions/origin/${cleanOrigin}`
    );
    
    if (!metaResponse.ok) {
      return NextResponse.json({ error: "Font not found" }, { status: 404 });
    }
    
    const ordinal = await metaResponse.json();
    const mapData = ordinal.origin?.data?.map;
    
    // Validate it's a theme-token font
    if (mapData?.app !== "theme-token" || mapData?.type !== "font") {
      return NextResponse.json(
        { error: "Not a theme-token font" },
        { status: 400 }
      );
    }
    
    // Return font metadata
    return NextResponse.json({
      origin: cleanOrigin,
      name: mapData.name,
      weight: mapData.weight || "400",
      style: mapData.style || "normal",
      license: mapData.license || "Unknown",
      author: mapData.author || null,
      website: mapData.website || null,
      aiGenerated: mapData.aiGenerated === "true",
      glyphCount: mapData.glyphCount ? parseInt(mapData.glyphCount) : null,
      contentUrl: `https://ordfs.network/content/${cleanOrigin}`,
      cssUrl: `https://themetoken.dev/r/fonts/${cleanOrigin}.css`,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Font Registry API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch font" },
      { status: 500 },
    );
  }
}
```

### 5.2 Font CSS Route

**New file: `/Users/satchmo/code/theme-token/src/app/r/fonts/[origin]/css/route.ts`**

```typescript
const ORDINALS_API = "https://ordinals.gorillapool.io/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ origin: string }> },
) {
  try {
    const { origin } = await params;
    const cleanOrigin = origin.replace(/\.css$/, "");
    
    // Fetch metadata
    const metaResponse = await fetch(
      `${ORDINALS_API}/inscriptions/origin/${cleanOrigin}`
    );
    
    if (!metaResponse.ok) {
      return new Response("/* Font not found */", {
        status: 404,
        headers: { "Content-Type": "text/css" },
      });
    }
    
    const ordinal = await metaResponse.json();
    const mapData = ordinal.origin?.data?.map;
    
    if (mapData?.app !== "theme-token" || mapData?.type !== "font") {
      return new Response("/* Not a theme-token font */", {
        status: 400,
        headers: { "Content-Type": "text/css" },
      });
    }
    
    const fontName = mapData?.name || "OnChainFont";
    const weight = mapData?.weight || "400";
    const style = mapData?.style || "normal";
    
    const css = `
@font-face {
  font-family: "${fontName}";
  src: url("https://ordfs.network/content/${cleanOrigin}") format("woff2");
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}
`.trim();
    
    return new Response(css, {
      headers: {
        "Content-Type": "text/css",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("[Font CSS API] Error:", error);
    return new Response("/* Error loading font */", {
      status: 500,
      headers: { "Content-Type": "text/css" },
    });
  }
}
```

---

## Phase 6: Wallet Context Extension

### 6.1 Add Font State to Wallet Provider

**File: `/Users/satchmo/code/theme-token/src/hooks/use-yours-wallet.tsx`**

Add these types and state to the existing provider:

```typescript
// Add to types section (around line 35)
export interface OwnedFont {
  font: FontToken;
  outpoint: string;
  origin: string;
}

// Add to WalletContextValue interface (around line 41)
interface WalletContextValue {
  // ... existing properties ...
  
  // Font state
  ownedFonts: OwnedFont[];
  pendingFonts: OwnedFont[];
  isLoadingFonts: boolean;
  addPendingFont: (font: FontToken, txid: string) => void;
}

// Add state in WalletProvider (around line 72)
const [ownedFonts, setOwnedFonts] = useState<OwnedFont[]>([]);
const [pendingFonts, setPendingFonts] = useState<OwnedFont[]>([]);
const [isLoadingFonts, setIsLoadingFonts] = useState(false);

// Add font fetching function (after fetchThemeTokens)
const fetchOwnedFonts = useCallback(async () => {
  const wallet = walletRef.current;
  if (!wallet) return;
  
  setIsLoadingFonts(true);
  
  try {
    const response = await wallet.getOrdinals({ limit: 100 });
    const fonts: OwnedFont[] = [];
    const ordinals = Array.isArray(response)
      ? response
      : (response?.ordinals ?? []);
    
    for (const ordinal of ordinals) {
      try {
        const mimeType = ordinal.origin?.data?.insc?.file?.type;
        const mapData = ordinal.origin?.data?.map;
        
        // Check if it's a font inscription
        if (
          (mimeType?.startsWith("font/") || mimeType === "application/font-woff2") &&
          mapData?.app === "theme-token" &&
          mapData?.type === "font"
        ) {
          fonts.push({
            font: {
              origin: ordinal.origin?.outpoint || ordinal.outpoint,
              name: mapData.name || "Unknown",
              weight: mapData.weight || "400",
              style: (mapData.style as "normal" | "italic") || "normal",
              format: "woff2",
              license: mapData.license || "Unknown",
              author: mapData.author,
              aiGenerated: mapData.aiGenerated === "true",
              glyphCount: mapData.glyphCount ? parseInt(mapData.glyphCount) : undefined,
            },
            outpoint: ordinal.outpoint,
            origin: ordinal.origin?.outpoint || ordinal.outpoint,
          });
        }
      } catch {
        // Skip invalid ordinals
      }
    }
    
    setOwnedFonts(fonts);
  } catch (err) {
    console.error("[Wallet] Error fetching fonts:", err);
  } finally {
    setIsLoadingFonts(false);
  }
}, []);

// Call fetchOwnedFonts alongside fetchThemeTokens
// In connect(), after fetchThemeTokens():
await fetchOwnedFonts();

// Add to provider value
value={{
  // ... existing ...
  ownedFonts,
  pendingFonts,
  isLoadingFonts,
  addPendingFont: (font, txid) => {
    const origin = `${txid}_0`;
    setPendingFonts((prev) => [...prev, { font, outpoint: origin, origin }]);
  },
}}
```

---

## Implementation Phases & Timeline

### Phase 1: Schema Extension (Week 1)
- [ ] Update `/public/v1/schema.json` with font-origin properties
- [ ] Update `@theme-token/sdk` zod schemas
- [ ] Add font types to SDK
- [ ] Publish SDK update (bump version)
- [ ] Bump schema version if needed

### Phase 2: Font Loading (Week 1-2)
- [ ] Create `/src/lib/font-loader.ts` with ORDFS loading
- [ ] Integrate with existing `/src/lib/fonts.ts`
- [ ] Add caching (memory + optional localStorage)
- [ ] Error handling and fallbacks
- [ ] Test with existing font inscriptions

### Phase 3: Font Marketplace (Week 2-3)
- [ ] Update `/src/app/market/layout.tsx` with Fonts tab
- [ ] Add `fetchFontMarketListings` to `/src/lib/yours-wallet.ts`
- [ ] Create `/src/components/market/font-card.tsx`
- [ ] Create `/src/components/market/font-filter-sidebar.tsx`
- [ ] Create `/src/app/market/fonts/page.tsx`
- [ ] Create `/src/app/market/fonts/layout.tsx`
- [ ] Add "My Fonts" section or page

### Phase 4: Studio Integration (Week 3-4)
- [ ] Create `/src/components/font-selector.tsx`
- [ ] Integrate into `/src/components/theme-studio.tsx` typography tab
- [ ] Add owned fonts picker functionality
- [ ] Add market fonts browser
- [ ] Add manual origin input
- [ ] Test live preview with on-chain fonts

### Phase 5: Registry Endpoints (Week 4)
- [ ] Create `/src/app/r/fonts/[origin]/route.ts` JSON endpoint
- [ ] Create `/src/app/r/fonts/[origin]/css/route.ts` CSS endpoint
- [ ] Add font preview page `/src/app/preview/font/[origin]/page.tsx`
- [ ] Test endpoints

### Phase 6: Wallet Integration (Week 4-5)
- [ ] Add `ownedFonts` state to `/src/hooks/use-yours-wallet.tsx`
- [ ] Add font fetching in wallet connection flow
- [ ] Add `pendingFonts` support for optimistic UI
- [ ] Test full flow

---

## Critical Files for Implementation

1. **`/Users/satchmo/code/theme-token/public/v1/schema.json`** - Add font-origin properties to JSON Schema definition

2. **`/Users/satchmo/code/theme-token/src/lib/font-loader.ts`** (new) - Core ORDFS font loading and caching system

3. **`/Users/satchmo/code/theme-token/src/lib/yours-wallet.ts`** - Add font marketplace fetchers (`fetchFontMarketListings`) and `FontMarketListing` type

4. **`/Users/satchmo/code/theme-token/src/components/font-selector.tsx`** (new) - Hybrid font picker component for studio with Google/On-Chain/Custom modes

5. **`/Users/satchmo/code/theme-token/src/app/market/fonts/page.tsx`** (new) - Font marketplace browse page

---

## Data Flow Summary

```
Theme Creation Flow:
User in Studio -> FontSelector -> Selects on-chain font 
  -> font-sans-origin set in theme JSON
  -> Theme inscribed with font reference

Theme Application Flow:
Theme loaded -> loadThemeFonts() 
  -> Detects font-sans-origin 
  -> loadOnChainFont(origin) 
  -> Fetches WOFF2 from ORDFS 
  -> Creates FontFace 
  -> Adds to document.fonts 
  -> Updates CSS variable with new family name
  -> Font renders in UI
```

## Considerations

### Caching Strategy
- Memory cache for FontFace objects (session lifetime)
- Deduplication via `loadedFontOrigins` Set
- Optional localStorage cache for font metadata (reduce API calls)
- Service worker cache for actual font binaries (future optimization)

### Error Handling
- If ORDFS fails, fall back to font-family string (Google/system)
- Show loading indicator while font loads
- Toast notification if font fails to load
- Graceful degradation to system fonts

### Performance
- Lazy load fonts on hover in marketplace (FontCard)
- Preload fonts when theme preview is hovered
- Use intersection observer for font card visibility (future)
- Batch font loading when multiple origins in theme

### Security
- Validate origin format before fetching
- CORS handled by ORDFS (public content)
- No private data transmitted
