import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info-page";

export const metadata: Metadata = {
	title: "Contact Theme Token",
	description:
		"Where to report Theme Token bugs, ask protocol questions, and request help with a published theme.",
	alternates: { canonical: "/contact" },
};

export default function ContactPage() {
	return (
		<InfoPage
			eyebrow="Contact"
			title="Talk to the people building Theme Token"
			intro="Theme Token is developed in public by Open Protocol Labs. The best contact route depends on whether you found a reproducible bug, have a protocol question, or need help identifying an on-chain item."
		>
			<InfoSection title="Bugs and feature requests">
				<p>
					Open an issue in the{" "}
					<a
						href="https://github.com/b-open-io/theme-token/issues"
						className="text-primary underline underline-offset-4"
					>
						Theme Token GitHub repository
					</a>
					. Include the page URL, wallet type, browser, and the exact error. For
					an on-chain publishing problem, include the transaction ID or
					outpoint. A screenshot helps with visual defects, but the text of an
					error is usually more useful for diagnosis.
				</p>
			</InfoSection>

			<InfoSection title="Protocol and integration questions">
				<p>
					Read the{" "}
					<Link
						href="/spec"
						className="text-primary underline underline-offset-4"
					>
						Theme Token specification
					</Link>{" "}
					before filing an integration question. If the behavior and the
					published specification disagree, file an issue with a small example.
					Questions about the underlying 1Sat protocols may belong in the
					relevant{" "}
					<a
						href="https://github.com/b-open-io/1sat-sdk"
						className="text-primary underline underline-offset-4"
					>
						1Sat SDK repository
					</a>
					.
				</p>
			</InfoSection>

			<InfoSection title="Public contact">
				<p>
					Open Protocol Labs posts as{" "}
					<a
						href="https://x.com/opldotdev"
						className="text-primary underline underline-offset-4"
					>
						@opldotdev on X
					</a>
					. Do not post seed phrases, private keys, unpublished credentials, or
					wallet backups in an issue or social message. Theme Token support will
					never need them. Public blockchain transactions cannot be reversed by
					the site operator.
				</p>
			</InfoSection>
		</InfoPage>
	);
}
