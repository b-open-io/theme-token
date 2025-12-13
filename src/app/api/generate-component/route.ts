import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDraft } from "@/lib/storage";
import { generateWithValidation } from "@/lib/validated-generation";
import { getInstalledPackageNames, getUiComponentNames, validateGeneratedRegistryCode } from "@/lib/registry/validate-generated";
import { extractComponentName } from "@/lib/sandbox";
import { createSandboxPreview } from "@/lib/sandbox-preview";

export const runtime = "nodejs";

// Schema for a generated component
const componentSchema = z.object({
	name: z.string().describe("Component name in kebab-case, e.g., 'animated-button' or 'status-badge'"),
	description: z.string().describe("Short description of what the component does"),
	dependencies: z.array(z.string()).describe("NPM packages required (e.g., ['lucide-react', 'class-variance-authority'])"),
	registryDependencies: z.array(z.string()).describe("shadcn components used as base (e.g., ['button', 'badge'])"),
	content: z.string().describe("The complete component file content - React/TypeScript code"),
});

type ComponentSchema = z.infer<typeof componentSchema>;

// System prompt for component generation
const COMPONENT_SYSTEM_PROMPT = `You are a shadcn UI Component Architect. You generate production-ready React components that follow shadcn patterns exactly.

## Output Requirements

Generate components that:
1. Use TypeScript with proper types
2. Follow shadcn component patterns (forwardRef, variants with cva)
3. Are fully theme-aware (CSS variables only)
4. Are highly reusable with sensible props

## CRITICAL: JavaScript Import Syntax

You MUST use valid JavaScript import syntax. These are the ONLY valid patterns:

CORRECT imports:
- import React from "react"
- import * as React from "react"
- import { useState, useEffect, useRef } from "react"
- import { Button } from "@/components/ui/button"
- import { ChevronRight, Star } from "lucide-react"
- import { cn } from "@/lib/utils"
- import { cva, type VariantProps } from "class-variance-authority"
- import { motion } from "framer-motion"

INVALID imports (will cause syntax errors):
- import * from "react"           // WRONG - missing "as X"
- import * from "lucide-react"    // WRONG - missing "as X"
- import * from "framer-motion"   // WRONG - missing "as X"

The pattern "import * from" WITHOUT "as" is INVALID JavaScript and WILL CRASH.
If you need all exports, use: import * as ModuleName from "module"

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

function buildComponentSystemPrompt(): string {
	const packages = getInstalledPackageNames();
	const ui = getUiComponentNames();
	const pkgList = packages.slice(0, 120).join(", ");
	const uiList = ui.slice(0, 80).join(", ");

	return `${COMPONENT_SYSTEM_PROMPT}

## Available Imports (MUST FOLLOW)
- You may ONLY import from packages already installed in this project.
- If you need something not installed, implement it yourself instead of adding a new dependency.
- Prefer importing shadcn primitives from \`@/components/ui/*\`.

Installed packages (sample): ${pkgList}${packages.length > 120 ? ", ..." : ""}

Available shadcn ui components (sample): ${uiList}${ui.length > 80 ? ", ..." : ""}
`;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prompt, name, variants, userId, paymentTxid, attempt, previousErrors } = body as {
			prompt?: string;
			name?: string;
			variants?: string[];
			userId?: string;
			paymentTxid?: string;
			attempt?: number;
			previousErrors?: string[];
		};

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

		const attemptNumber = typeof attempt === "number" && attempt > 0 ? attempt : 1;
		if (attemptNumber > 1 && Array.isArray(previousErrors) && previousErrors.length > 0) {
			userPrompt += `\n\nIMPORTANT: Your previous attempt failed to build/preview. Fix these issues exactly:\n${previousErrors.map((e, i) => `${i + 1}. ${e}`).join("\n")}\n\nRegenerate a complete, working component that only imports from packages already installed in this project and local shadcn components under @/components/ui.`;
		}

		// Generate once per request (retry loop is handled by the client for visible progress)
		const result = await generateWithValidation<ComponentSchema>({
			schema: componentSchema,
			systemPrompt: buildComponentSystemPrompt(),
			userPrompt,
			maxRetries: 1,
			codeExtractor: (comp) => comp.content,
		});

		if (!result.success || !result.data) {
			return NextResponse.json(
				{
					error: "Code validation failed after multiple attempts",
					validation: result.validation,
					attempts: result.attempts,
				},
				{ status: 422 },
			);
		}

		const component = result.data;

		// Validate imports/dependencies against what's actually available in this project
		const importValidation = validateGeneratedRegistryCode({
			files: [{ path: `${component.name}.tsx`, content: component.content }],
			declaredDependencies: component.dependencies,
			registryDependencies: component.registryDependencies,
		});

		if (!importValidation.valid) {
			return NextResponse.json(
				{
					error: "Code validation failed",
					validation: {
						valid: false,
						errors: importValidation.errors,
						warnings: [...result.validation.warnings, ...importValidation.warnings],
					},
					attempts: attemptNumber,
				},
				{ status: 422 },
			);
		}

		// Validate that the component can actually be bundled in the sandbox preview environment
		const componentName = extractComponentName(component.content) ?? undefined;
		const sandboxPreview = await createSandboxPreview({
			files: [{ path: `${component.name}.tsx`, content: component.content }],
			mainFilePath: `${component.name}.tsx`,
			componentNameHint: componentName,
		});

		if (!sandboxPreview.success) {
			return NextResponse.json(
				{
					error: "Sandbox preview validation failed",
					validation: {
						valid: false,
						errors: [sandboxPreview.error || "Sandbox bundling failed"],
						warnings: [...result.validation.warnings, ...importValidation.warnings],
					},
					attempts: attemptNumber,
				},
				{ status: 422 },
			);
		}

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
			previewUrl: sandboxPreview.url,
			validation: {
				valid: true,
				attempts: attemptNumber,
				warnings: [...result.validation.warnings, ...importValidation.warnings],
			},
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
