import { ExternalLink } from "lucide-react";
import { CodeBlock } from "@/components/code-block";

const code = `import { fetchThemeByOrigin, applyTheme } from "@theme-token/sdk";

const published = await fetchThemeByOrigin("<txid>_1");
if (!published) throw new Error("Theme not found");

applyTheme(published.theme);`;

export function ChainImplementations() {
	return (
		<div className="space-y-6">
			<div className="overflow-hidden rounded-xl border border-border bg-card">
				<div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
					<span className="font-mono text-xs text-muted-foreground">
						load-theme.ts
					</span>
					<a
						href="https://docs.1satordinals.com"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
					>
						1Sat Ordinals
						<ExternalLink className="h-3 w-3" />
					</a>
				</div>
				<CodeBlock
					code={code}
					language="typescript"
					className="border-none bg-transparent"
					showCopy
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-lg border border-border bg-card p-4">
					<div className="mb-1 text-xs text-muted-foreground">Storage</div>
					<div className="font-medium">ord-fs/json on BSV</div>
				</div>
				<div className="rounded-lg border border-border bg-card p-4">
					<div className="mb-1 text-xs text-muted-foreground">Discovery</div>
					<div className="font-medium">MAP registry:style</div>
				</div>
				<div className="rounded-lg border border-border bg-card p-4">
					<div className="mb-1 text-xs text-muted-foreground">Gateway</div>
					<div className="font-medium">1sat.app content API</div>
				</div>
			</div>
		</div>
	);
}
