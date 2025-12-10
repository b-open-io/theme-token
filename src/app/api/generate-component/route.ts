import { generateObject } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDraft } from "@/lib/storage";

// Schema for a generated component
const componentSchema = z.object({
	name: z.string().describe("Component name in kebab-case, e.g., 'animated-button' or 'status-badge'"),
	description: z.string().describe("Short description of what the component does"),
	dependencies: z.array(z.string()).describe("NPM packages required (e.g., ['lucide-react', 'class-variance-authority'])"),
	registryDependencies: z.array(z.string()).describe("shadcn components used as base (e.g., ['button', 'badge'])"),
	content: z.string().describe("The complete component file content - React/TypeScript code"),
});

// System prompt for component generation
const COMPONENT_SYSTEM_PROMPT = `You are a shadcn UI Component Architect. You generate production-ready React components that follow shadcn patterns exactly.

## Output Requirements

Generate components that:
1. Use TypeScript with proper types
2. Follow shadcn component patterns (forwardRef, variants with cva)
3. Are fully theme-aware (CSS variables only)
4. Are highly reusable with sensible props

## Import Conventions (CRITICAL)

Always use these exact import paths:
- Base components: import { Button } from "@/components/ui/button"
- Icons: import { ChevronRight, Star } from "lucide-react"
- Utils: import { cn } from "@/lib/utils"
- Variants: import { cva, type VariantProps } from "class-variance-authority"

## Component Pattern

Use the standard shadcn pattern:

\`\`\`tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const componentVariants = cva(
  "base-classes-here",
  {
    variants: {
      variant: {
        default: "default-styles",
        secondary: "secondary-styles",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {
  // Additional props here
}

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <element
        className={cn(componentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"

export { Component, componentVariants }
\`\`\`

## Styling Rules (CRITICAL)

NEVER use:
- Hex colors (#fff, #000, #3b82f6)
- RGB/HSL colors
- Hardcoded color values

ALWAYS use CSS variable classes:
- bg-background, bg-card, bg-primary, bg-secondary, bg-muted, bg-accent, bg-destructive
- text-foreground, text-muted-foreground, text-primary-foreground
- border-border, border-input
- ring-ring

## Code Quality

- Use forwardRef for DOM element components
- Include TypeScript interface extending HTML attributes
- Use cva for variant management
- Include proper accessibility attributes
- Add displayName for debugging

## Variant Guidelines

If the user requests variants, use cva with meaningful variant names:
- variant: visual style (default, destructive, outline, secondary, ghost, link)
- size: size variants (default, sm, lg, icon)
- Add custom variants as requested (e.g., status, color, etc.)
`;

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prompt, name, variants, userId, paymentTxid } = body;

		if (!prompt) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 }
			);
		}

		// Build the user prompt with optional constraints
		let userPrompt = `Generate a shadcn UI component based on this description:\n\n${prompt}`;

		if (name) {
			userPrompt += `\n\nComponent name should be: ${name}`;
		}

		if (variants && variants.length > 0) {
			userPrompt += `\n\nInclude these variants: ${variants.join(", ")}`;
		}

		const { object: component } = await generateObject({
			model: "google/gemini-3-pro-preview",
			schema: componentSchema,
			system: COMPONENT_SYSTEM_PROMPT,
			prompt: userPrompt,
		});

		// Transform to manifest format compatible with our registry gateway
		const manifest = {
			name: component.name,
			type: "registry:component" as const,
			description: component.description,
			dependencies: component.dependencies,
			registryDependencies: component.registryDependencies,
			files: [
				{
					path: `${component.name}.tsx`,
					type: "registry:component" as const,
					content: component.content,
					vout: 1,
				},
			],
		};

		// Save to cloud storage if userId provided (from paid generation)
		let draftId: string | undefined;
		if (userId) {
			try {
				const draft = await createDraft(userId, {
					type: "registry",
					name: component.name,
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
				console.error("Failed to save component to cloud storage:", storageError);
				// Continue even if storage fails - user still gets the component
			}
		}

		return NextResponse.json({
			component: manifest,
			// Include raw content for preview
			content: component.content,
			draftId,
		});
	} catch (error) {
		console.error("Component generation error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to generate component",
			},
			{ status: 500 }
		);
	}
}
