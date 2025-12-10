# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Theme Token is a Next.js 16 App Router application for creating, browsing, and publishing shadcn themes as 1Sat Ordinals on the BSV blockchain. Users can create themes via AI or manually, inscribe them on-chain, and install them using the standard shadcn CLI.

## Commands

```bash
bun dev           # Development server (port 3033)
bun run build     # Production build
bun run lint      # Biome check
bun run lint:fix  # Auto-fix linting
```

## Architecture

### Registry API (`/r/`)
The `/r/` routes serve as a shadcn registry gateway, transforming on-chain data into CLI-compatible format:
- `/r/themes/[origin]` - Fetches theme from ORDFS, validates, converts to shadcn registry format
- `/r/blocks/[origin]` - Hydrates multi-file block manifests from sibling inscriptions
- `/r/components/[origin]` - Same hydration for single components

Install themes: `bunx shadcn@latest add https://themetoken.dev/r/themes/[origin]`

### Bundle System (`{{vout:N}}` References)
Multi-asset inscriptions use `{{vout:N}}` placeholders in JSON to reference sibling outputs in the same transaction:
- Assets inscribed first (fonts, patterns at vout 0, 1, 2...)
- Theme/manifest inscribed last with references like `"font-sans": "{{vout:0}}"`
- Registry gateway resolves placeholders to absolute ORDFS URLs at serve time
- See `src/lib/bundle-builder.ts` and `src/lib/registry-gateway.ts`

### Swatchy AI Agent
AI assistant using Vercel AI SDK with Google Gemini models:
- System prompt built dynamically from feature flags (`src/lib/agent/config.ts`)
- Tools defined in `src/lib/agent/tools.ts` (navigate, generateTheme, setThemeColor, etc.)
- Chat API at `/api/swatchy-chat/route.ts`
- Paid generation tools (theme, font, pattern, wallpaper, block, component) require BSV payment

### Studio Store (`src/lib/stores/studio-store.ts`)
Zustand store for cross-studio state management:
- Swatchy queues pending changes (color, radius, font)
- Studios consume and apply changes via `consumePendingXChange()` methods
- Enables AI agent to control active studio in real-time

### Wallet Integration (`src/hooks/use-yours-wallet.tsx`)
Yours Wallet provider context:
- `inscribeTheme()` - Single theme inscription
- `inscribeBundle()` - Multi-output bundle inscription for themes with assets
- `listTheme()` - List ordinals on marketplace via OrdLock
- `sendPayment()` - BSV payments for AI generation fees

### Feature Flags (`src/lib/feature-flags.ts`)
Controls feature availability by environment:
- `fonts`, `images`, `registry`, `icons`, `wallpapers`
- All enabled in development, set via `NEXT_PUBLIC_FEATURE_*` in production

### Routes Registry (`src/lib/routes.ts`)
Centralized route definitions with metadata (path, description, feature flag, tools, costs). Used by navigation and Swatchy for dynamic system prompt generation.

## Key Directories

- `src/app/studio/` - Creative studios (theme, font, patterns, wallpaper, icon, registry)
- `src/app/market/` - Marketplace pages (browse, my-themes, sell)
- `src/app/api/generate-*/` - AI generation endpoints
- `src/lib/agent/` - Swatchy AI configuration and tools
- `src/lib/stores/` - Zustand stores
- `src/lib/storage/` - Cloud storage service (Vercel Blob/KV)

## Color Format

All theme colors use OKLCH format: `oklch(lightness chroma hue)`
- Lightness: 0-1
- Chroma: 0-0.4 (saturation)
- Hue: 0-360

## Image Background Removal

When generating images with AI that need transparent backgrounds:

### Method 1: Black Background + Color Key (Recommended)
```bash
bun scripts/remove-black-bg.ts <input.jpg> <output.png> [threshold]
```

### Method 2: AI Segmentation + Mask
```bash
bun scripts/apply-mask.ts <input> <mask.png> <output.png> [--invert]
```

## External Services

- **ORDFS**: `ordfs.network` - Ordinals File System for content retrieval
- **GorillaPool API**: `ordinals.gorillapool.io/api` - Inscription indexing and marketplace
- **Yours Wallet**: Browser extension wallet for BSV/ordinals
