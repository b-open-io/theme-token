import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata: Metadata = {
	title: "Theme Token Developer Guide",
	description:
		"Install on-chain themes, validate Theme Token documents, and integrate Theme Token with ShadCN and BRC-100 wallets.",
	alternates: { canonical: "/developers" },
};

const codeClass =
	"overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-sm";
const linkClass = "text-primary underline underline-offset-4";
const sdkExample = [
	'import { fetchThemeByOrigin, toShadcnRegistry, validateThemeToken } from "@theme-token/sdk";',
	"",
	"const published = await fetchThemeByOrigin(origin);",
	'if (!published) throw new Error("Theme not found");',
	"",
	"const validation = validateThemeToken(published.theme);",
	"if (!validation.valid) throw new Error(validation.error);",
	"",
	"const registryItem = toShadcnRegistry(validation.theme);",
].join("\n");

export default function DevelopersPage() {
	return (
		<InfoPage
			eyebrow="Developers"
			title="Build with Theme Token"
			intro="Theme Token exposes ordinary ShadCN registry URLs and a TypeScript SDK. Use the registry URL when you only need to install a published theme. Use the SDK when your application needs to validate, transform, fetch, or apply Theme Token documents."
		>
			<InfoSection title="Install a published theme">
				<p>
					Every indexed theme has a registry response compatible with the
					standard ShadCN CLI. Replace the origin with the theme&apos;s
					immutable
					<code className="mx-1 rounded bg-muted px-1.5 py-0.5">txid_vout</code>
					identifier.
				</p>
				<pre className={codeClass}>
					<code>
						bunx shadcn@latest add https://themetoken.dev/r/themes/[origin].json
					</code>
				</pre>
			</InfoSection>

			<InfoSection title="Use the SDK">
				<pre className={codeClass}>
					<code>bun add @theme-token/sdk</code>
				</pre>
				<pre className={codeClass}>
					<code>{sdkExample}</code>
				</pre>
				<p>
					See the{" "}
					<a
						href="https://www.npmjs.com/package/@theme-token/sdk"
						className={linkClass}
					>
						SDK package
					</a>{" "}
					and its{" "}
					<a
						href="https://github.com/b-open-io/theme-token-sdk"
						className={linkClass}
					>
						source
					</a>{" "}
					for the complete exported API.
				</p>
			</InfoSection>

			<InfoSection title="Protocol and wallet integration">
				<p>
					The{" "}
					<Link href="/spec" className={linkClass}>
						protocol specification
					</Link>{" "}
					documents the Theme Token JSON shape, MAP metadata, asset
					relationships, and registry output. The canonical schema is available
					at{" "}
					<Link href="/v1/schema.json" className={linkClass}>
						/v1/schema.json
					</Link>
					.
				</p>
				<p>
					Publishing and trading use the connected BRC-100 wallet. Applications
					should request the narrow wallet permissions needed for the current
					action and let the wallet present the final transaction for approval.
				</p>
			</InfoSection>

			<InfoSection title="Stable public resources">
				<ul className="list-disc space-y-2 pl-5">
					<li>
						Theme registry:{" "}
						<code>https://themetoken.dev/r/themes/[origin].json</code>
					</li>
					<li>
						Font stylesheet:{" "}
						<code>https://themetoken.dev/r/fonts/[origin]</code>
					</li>
					<li>
						Agent index:{" "}
						<Link href="/llms.txt" className={linkClass}>
							/llms.txt
						</Link>
					</li>
					<li>
						Markdown homepage:{" "}
						<Link href="/index.md" className={linkClass}>
							/index.md
						</Link>
					</li>
				</ul>
				<p>
					Theme Token does not currently publish a general-purpose REST API or
					MCP server. The routes above are the supported public integration
					surfaces.
				</p>
			</InfoSection>
		</InfoPage>
	);
}
