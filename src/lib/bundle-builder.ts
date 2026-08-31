import { Utils } from "@bsv/sdk";
import type { BundleItem } from "@/hooks/use-yours-wallet";

export interface RegistryFile {
	path: string;
	type: string;
	content: string;
}

export interface RegistryFileRef {
	path: string;
	type: string;
	vout: number;
}

export interface RegistryManifest {
	name: string;
	type: "registry:block" | "registry:component";
	description: string;
	dependencies: string[];
	registryDependencies: string[];
	files: RegistryFile[];
}

export interface InscribedRegistryManifest
	extends Omit<RegistryManifest, "files"> {
	files: RegistryFileRef[];
}

export interface RegistryBundleResult {
	items: BundleItem[];
	manifestWithRefs: InscribedRegistryManifest;
}

/** Build a registry manifest at vout 0 followed by its source files. */
export function buildRegistryBundle({
	manifest,
	author,
}: {
	manifest: RegistryManifest;
	author?: string;
}): RegistryBundleResult {
	const manifestWithRefs: InscribedRegistryManifest = {
		...manifest,
		files: manifest.files.map(({ path, type }, index) => ({
			path,
			type,
			vout: index + 1,
		})),
	};
	const encode = (content: string) =>
		Utils.toBase64(Utils.toArray(content, "utf8"));

	return {
		manifestWithRefs,
		items: [
			{
				type: manifest.type === "registry:block" ? "block" : "component",
				base64Data: encode(JSON.stringify(manifestWithRefs, null, 2)),
				mimeType: "application/json",
				name: manifest.name,
				metadata: {
					registryType: manifest.type,
					...(author && { author }),
				},
			},
			...manifest.files.map((file) => ({
				type: "file" as const,
				base64Data: encode(file.content),
				mimeType: "text/plain",
				name: file.path,
				metadata: { registryType: file.type, path: file.path },
			})),
		],
	};
}
