import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata: Metadata = {
	title: "About Theme Token",
	description:
		"How Theme Token publishes portable ShadCN themes and design assets as 1Sat Ordinals on BSV.",
	alternates: { canonical: "/about" },
};

export default function AboutPage() {
	return (
		<InfoPage
			eyebrow="About"
			title="Themes you can keep, inspect, and install"
			intro="Theme Token is an open protocol and web application for publishing ShadCN-compatible themes as 1Sat Ordinals on BSV. A published theme has a stable origin, a public history, and a registry URL that works with the standard ShadCN CLI."
		>
			<InfoSection title="What Theme Token does">
				<p>
					The Theme Studio authors light and dark design tokens, previews them
					against real interface components, and packages the result for
					on-chain publishing. The site also resolves published packages into
					ShadCN registry responses, so developers can install a theme without
					learning the underlying transaction format.
				</p>
				<p>
					The protocol can link a theme with immutable fonts, patterns, and
					wallpapers. Those relationships are explicit in the theme document.
					Apps can verify each asset and decide how to deliver it instead of
					relying on a private asset host.
				</p>
			</InfoSection>

			<InfoSection title="Who maintains it">
				<p>
					Theme Token is maintained by Open Protocol Labs. The implementation
					and protocol work are developed in public in the{" "}
					<a
						href="https://github.com/b-open-io/theme-token"
						className="text-primary underline underline-offset-4"
					>
						Theme Token repository
					</a>
					. The SDK is published as{" "}
					<a
						href="https://www.npmjs.com/package/@theme-token/sdk"
						className="text-primary underline underline-offset-4"
					>
						@theme-token/sdk
					</a>
					.
				</p>
			</InfoSection>

			<InfoSection title="Read and build">
				<p>
					The{" "}
					<Link
						href="/spec"
						className="text-primary underline underline-offset-4"
					>
						specification
					</Link>{" "}
					documents the theme format, publishing metadata, registry output, and
					asset relationships. Agents and automated tools can start with{" "}
					<Link
						href="/llms.txt"
						className="text-primary underline underline-offset-4"
					>
						llms.txt
					</Link>
					. Human-readable previews and the install command are available for
					every indexed theme.
				</p>
			</InfoSection>
		</InfoPage>
	);
}
