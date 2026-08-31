import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata: Metadata = {
	title: "Theme Token Privacy",
	description:
		"How Theme Token handles wallet permissions, drafts, AI generation requests, cookies, and public blockchain data.",
	alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
	return (
		<InfoPage
			eyebrow="Privacy"
			title="Privacy at Theme Token"
			intro="This page describes the data Theme Token handles when you browse the site, connect a wallet, save a draft, use an AI feature, or publish to the BSV blockchain. It was last updated on August 31, 2026."
		>
			<InfoSection title="Browsing and theme sessions">
				<p>
					Theme Token uses a short-lived theme session cookie to keep the
					selected visual theme stable across page loads. The cookie contains a
					public theme origin and an assignment timestamp. Browser storage may
					also keep local drafts and interface preferences. Clearing site data
					removes those local values.
				</p>
			</InfoSection>

			<InfoSection title="Wallet connections and payments">
				<p>
					Wallet access is handled through a BRC-100-compatible wallet such as
					BSV Desktop or Yours Wallet. The wallet shows permission and
					transaction requests. Theme Token receives the information approved
					for that request, such as public identity details, addresses, owned
					outputs, or a transaction result. Private keys and seed phrases remain
					in the wallet and should never be entered into Theme Token.
				</p>
			</InfoSection>

			<InfoSection title="Drafts and AI generation">
				<p>
					Connected users can save design drafts in hosted storage. Draft
					records may include a wallet-derived public identifier, the draft
					name, design data, generation prompt, provider and model names, file
					metadata, and expiration timestamps. Binary assets may be stored in
					Vercel Blob and draft metadata in Vercel KV. The application removes
					expired drafts during reads and cleanup jobs, and users can delete
					drafts through the product.
				</p>
				<p>
					When you request AI generation, the prompt and necessary design
					context are sent to the configured model provider through the
					application backend. Avoid including secrets or personal information
					in a prompt.
				</p>
			</InfoSection>

			<InfoSection title="Published blockchain data">
				<p>
					Publishing writes the selected content and metadata to the public BSV
					blockchain. That data can be copied, indexed, and served by
					independent services. It is designed to remain available and cannot be
					deleted by Theme Token after broadcast. Review names, prompts, author
					fields, licenses, and files before approving a wallet transaction.
				</p>
			</InfoSection>

			<InfoSection title="Questions">
				<p>
					For a privacy question or a report about data exposed by the web
					application, use the routes on the{" "}
					<Link
						href="/contact"
						className="text-primary underline underline-offset-4"
					>
						contact page
					</Link>
					. Do not include wallet secrets in a report.
				</p>
			</InfoSection>
		</InfoPage>
	);
}
