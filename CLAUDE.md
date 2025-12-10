# Theme Token - Claude Code Instructions

## Project Overview
Next.js App Router project for creating, browsing, and publishing shadcn themes on Bitcoin (BSV).

## Commands
```bash
bun dev           # Development server
bun run build     # Production build
bun run lint      # Biome check
bun run lint:fix  # Auto-fix linting
```

## Key Directories
- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utilities and helpers
- `src/app/studio/` - Theme/Font/Pattern/AI studios
- `public/` - Static assets including Swatchy mascot images

## Feature Flags
Feature flags are defined in `src/lib/feature-flags.ts`. Check this file when adding new features that should be gated.

## Image Background Removal Process

When generating images with AI (Gemini) that need transparent backgrounds:

### Method 1: Black Background + Color Key (Recommended)
1. Generate image with Gemini on pure black (#000000) background
2. Run the color-key removal script:
```bash
bun scripts/remove-black-bg.ts <input.jpg> <output.png> [threshold]
```
- Default threshold is 15 (removes very dark colors only)
- Increase threshold (e.g., 25-30) if dark artifacts remain

### Method 2: AI Segmentation + Mask
1. Generate segmentation mask with Gemini:
```bash
# Use gemini_segment MCP tool with prompt describing the subject
```
2. Apply mask to create transparent PNG:
```bash
bun scripts/apply-mask.ts <input> <mask.png> <output.png> [--invert]
```
- Use `--invert` if mask colors are reversed

### Notes
- Gemini outputs JPEG even when transparency is shown (checkerboard pattern)
- Method 1 is simpler and more reliable for solid color backgrounds
- Method 2 works for complex backgrounds but mask resolution (256x256) can cause edge artifacts

## Swatchy Mascot
The mascot "Swatchy" is a colorful fabric swatch character. Images are in `/public/`:
- `swatchy-icon.jpeg` - Icon with white background
- `swatchy-icon-black-bg.jpg` - Icon on black background
- `swatchy-meditation.png` - Meditating pose with transparent background
- `swatchy-not-found.jpeg` - 404 page version
