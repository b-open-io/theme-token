import type { Graph, Thing, WithContext } from "schema-dts";

type JsonLdData = WithContext<Thing> | Graph;

export function JsonLd({ data }: { data: JsonLdData }) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: serializing trusted JSON-LD structured data with escaped < to prevent injection
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, "\\u003c"),
			}}
		/>
	);
}
