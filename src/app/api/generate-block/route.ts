import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDraft } from "@/lib/storage";

// Schema for a generated file in a block
const fileSchema = z.object({
	path: z.string().describe("File path relative to block root, e.g., 'pricing-table.tsx' or 'hooks/use-pricing.ts'"),
	type: z.enum(["registry:block", "registry:component", "registry:hook", "registry:lib", "registry:ui"])
		.describe("The registry type for this file"),
	content: z.string().describe("The complete file content - React/TypeScript code"),
});

// Schema for a complete block
const blockSchema = z.object({
	name: z.string().describe("Block name in kebab-case, e.g., 'pricing-table' or 'stats-dashboard'"),
	description: z.string().describe("Short description of what the block does"),
	dependencies: z.array(z.string()).describe("NPM packages required (e.g., ['lucide-react', 'date-fns'])"),
	registryDependencies: z.array(z.string()).describe("shadcn components used (e.g., ['button', 'card', 'badge'])"),
	files: z.array(fileSchema).describe("Array of files that make up this block"),
});

// System prompt for block generation
const BLOCK_SYSTEM_PROMPT = `You are a shadcn UI Block Architect. You generate production-ready React blocks that follow shadcn patterns exactly.

## Output Requirements

Generate blocks that:
1. Use TypeScript with proper types
2. Follow shadcn component patterns
3. Are fully theme-aware (CSS variables only)

## Import Conventions (CRITICAL)

Always use these exact import paths:
- Components: import { Button } from "@/components/ui/button"
- Icons: import { ChevronRight, Star } from "lucide-react"
- Utils: import { cn } from "@/lib/utils"
- Hooks (custom): import { useMyHook } from "./hooks/use-my-hook"

## Styling Rules (CRITICAL)

NEVER use:
- Hex colors (#fff, #000, #3b82f6)
- RGB/HSL colors (rgb(59, 130, 246))
- Hardcoded color values

ALWAYS use CSS variable classes:
- bg-background, bg-card, bg-popover, bg-primary, bg-secondary, bg-muted, bg-accent, bg-destructive
- text-foreground, text-muted-foreground, text-primary-foreground, text-secondary-foreground
- border-border, border-input
- ring-ring

## Code Quality

- Export the main component as default
- Use descriptive prop names and TypeScript interfaces
- Include proper accessibility attributes (aria-*, role, etc.)
- Use Tailwind's responsive prefixes (sm:, md:, lg:) appropriately
- Include hover/focus states using Tailwind classes

## File Structure

For simple blocks (single component):
- One file: "block-name.tsx"

For complex blocks (with hooks or utilities):
- Main component: "block-name.tsx"
- Hooks: "hooks/use-block-name.ts"
- Types: "types.ts" (if needed)

## Example Output Structure

For a pricing table block:
- name: "pricing-table"
- registryDependencies: ["button", "card", "badge"]
- dependencies: ["lucide-react"]
- files: [
    { path: "pricing-table.tsx", type: "registry:block", content: "..." }
  ]
`;

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prompt, name, includeHook, userId, paymentTxid } = body;

		if (!prompt) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 }
			);
		}

		// Build the user prompt with optional constraints
		let userPrompt = `Generate a shadcn UI block based on this description:\n\n${prompt}`;

		if (name) {
			userPrompt += `\n\nBlock name should be: ${name}`;
		}

		if (includeHook) {
			userPrompt += `\n\nInclude a companion React hook to manage state/logic.`;
		}

		const { object: block } = await generateObject({
			model: "google/gemini-3-pro-preview",
			schema: blockSchema,
			system: BLOCK_SYSTEM_PROMPT,
			prompt: userPrompt,
		});

		// Transform to manifest format compatible with our registry gateway
		const manifest = {
			name: block.name,
			type: "registry:block" as const,
			description: block.description,
			dependencies: block.dependencies,
			registryDependencies: block.registryDependencies,
			files: block.files.map((file, index) => ({
				path: file.path,
				type: file.type,
				// For inscription, files go into separate vouts
				// For now, we include content directly for preview
				content: file.content,
				// Vout index will be assigned during inscription (vout 0 = manifest)
				vout: index + 1,
			})),
		};

		// Save to cloud storage if userId provided (from paid generation)
		let draftId: string | undefined;
		if (userId) {
			try {
				const draft = await createDraft(userId, {
					type: "registry",
					name: block.name,
					data: {
						manifest,
						paymentTxid,
						status: "draft",
					},
					metadata: {
						prompt,
						sourceType: "ai",
					},
				});
				draftId = draft.id;
			} catch (storageError) {
				console.error("Failed to save block to cloud storage:", storageError);
				// Continue even if storage fails - user still gets the block
			}
		}

		return NextResponse.json({
			block: manifest,
			// Include raw files for preview
			files: block.files,
			draftId,
		});
	} catch (error) {
		console.error("Block generation error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate block",
			},
			{ status: 500 }
		);
	}
}
