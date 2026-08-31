import {
	ONESAT_PROTOCOL,
	ORDINALS_BASKET,
	REGISTRY_TYPE_SET,
	type RegistryType,
	stampManagedOutputIds,
} from "@1sat/actions";
import { Inscription, MAP, MAP_PREFIX } from "@1sat/templates";
import {
	P2PKH,
	PublicKey,
	Script,
	Utils,
	type WalletInterface,
} from "@bsv/sdk";
import {
	getPublishedAssetKind,
	LEGACY_THEME_TYPE,
	type PackageMapMetadata,
	REGISTRY_ASSET_TYPE,
	type ThemeTokenAssetKind,
} from "@/lib/asset-metadata";
import { type OneSatRelayResult, relayAtomicBeef } from "@/lib/onesat-relay";
import { submitToIndexer } from "@/lib/yours-wallet";

const MANIFEST_CONTENT_TYPE = "ord-fs/json";
/**
 * A file to include in a registry package inscription.
 * Mirrors PackageFile from @1sat/actions.
 */
export interface PackageFile {
	path: string;
	content: Uint8Array;
	contentType: string;
}

/**
 * Result from publishing a package via CWI wallet.
 */
export interface PublishPackageResult {
	/** Transaction ID */
	txid: string;
	/** Vout index of the manifest inscription */
	manifestVout: number;
	/** Origin outpoints for each output: ["{txid}_0", "{txid}_1", ...] */
	origins: string[];
	/** 1Sat propagation result when the wallet returned Atomic BEEF. */
	relay?: OneSatRelayResult;
}

/**
 * Publish a registry package via CWI wallet.
 *
 * Builds the same ord-fs/json manifest structure as `buildPackageOutputs`,
 * but uses `wallet.createAction()` instead of requiring a raw PrivateKey.
 * AIP signing is skipped — the wallet's transaction signature provides authorship.
 *
 * Output layout:
 *   [0..N-1]  file inscriptions (1 sat each)
 *   [N]       subdirectory manifests (if any)
 *   [last]    root manifest with MAP metadata suffix (1 sat, tracked ordinal)
 */
export async function publishPackage(
	wallet: WalletInterface,
	files: PackageFile[],
	metadata: PackageMapMetadata,
): Promise<PublishPackageResult> {
	// Derive ord address and P2PKH prefix for inscription outputs
	const keyID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const { publicKey } = await wallet.getPublicKey({
		protocolID: ONESAT_PROTOCOL,
		keyID,
		counterparty: "self",
		forSelf: true,
	});
	const address = PublicKey.fromString(publicKey).toAddress();
	const p2pkhPrefix = new P2PKH().lock(address);

	const outputs: Array<{
		lockingScript: string;
		satoshis: number;
		outputDescription: string;
		basket?: string;
		tags?: string[];
		customInstructions?: string;
	}> = [];

	// -------------------------------------------------------------------
	// 1. File inscription outputs
	// -------------------------------------------------------------------
	for (const file of files) {
		const inscription = Inscription.create(file.content, file.contentType, {
			scriptPrefix: p2pkhPrefix,
		});
		outputs.push({
			lockingScript: Utils.toHex(inscription.lock().toBinary()),
			satoshis: 1,
			outputDescription: `file: ${file.path}`,
		});
	}

	// -------------------------------------------------------------------
	// 2. Build the ord-fs directory tree
	// -------------------------------------------------------------------
	const rootFiles: Array<{ name: string; vout: number }> = [];
	const subdirs = new Map<string, Array<{ name: string; vout: number }>>();

	for (let i = 0; i < files.length; i++) {
		const parts = files[i].path.split("/");
		if (parts.length === 1) {
			rootFiles.push({ name: parts[0], vout: i });
		} else {
			const dir = parts[0];
			const rest = parts.slice(1).join("/");
			if (!subdirs.has(dir)) subdirs.set(dir, []);
			subdirs.get(dir)?.push({ name: rest, vout: i });
		}
	}

	// Create subdirectory manifest inscriptions
	const subdirVouts = new Map<string, number>();
	for (const [dirName, entries] of subdirs) {
		const subdirManifest: Record<string, string> = {};
		for (const entry of entries) {
			subdirManifest[entry.name] = `_${entry.vout}`;
		}
		const subdirBytes = new Uint8Array(
			Utils.toArray(JSON.stringify(subdirManifest), "utf8"),
		);
		const subdirInscription = Inscription.create(
			subdirBytes,
			MANIFEST_CONTENT_TYPE,
			{ scriptPrefix: p2pkhPrefix },
		);
		const subdirVout = outputs.length;
		outputs.push({
			lockingScript: Utils.toHex(subdirInscription.lock().toBinary()),
			satoshis: 1,
			outputDescription: `dir: ${dirName}/`,
		});
		subdirVouts.set(dirName, subdirVout);
	}

	// Build root manifest — references root files and subdirectory manifests
	const manifest: Record<string, string> = {};
	for (const entry of rootFiles) {
		manifest[entry.name] = `_${entry.vout}`;
	}
	for (const [dirName, vout] of subdirVouts) {
		manifest[dirName] = `_${vout}`;
	}
	if (
		files.length > 0 &&
		(getPublishedAssetKind(metadata) ||
			metadata.type === "registry:block" ||
			metadata.type === "registry:component")
	) {
		manifest["."] = "_0";
	}
	const manifestBytes = new Uint8Array(
		Utils.toArray(JSON.stringify(manifest), "utf8"),
	);

	// -------------------------------------------------------------------
	// 3. MAP metadata suffix (no AIP — wallet handles authorship)
	// -------------------------------------------------------------------
	const mapFields: Record<string, string> = {
		app: metadata.app,
		type: metadata.type,
		name: metadata.name,
		version: metadata.version,
		description: metadata.description,
	};
	// Copy optional and extra fields
	for (const [key, value] of Object.entries(metadata)) {
		if (value != null && !(key in mapFields)) {
			mapFields[key] = value;
		}
	}

	const mapScript = MAP.set(mapFields);
	// MAP.set() returns OP_RETURN | MAP_PREFIX | data locking script.
	// We need just the data chunks (skip OP_RETURN and MAP_PREFIX pushdata).
	const mapDataChunks = mapScript.chunks.slice(2);
	const mapDataScript = new Script(mapDataChunks);

	// Build the suffix script: OP_RETURN MAP_PREFIX <map-data>
	// This mirrors buildBitComSuffix() from @1sat/actions.
	const mapSuffix = new Script();
	mapSuffix.writeOpCode(0x6a); // OP_RETURN
	mapSuffix.writeBin(Utils.toArray(MAP_PREFIX, "utf8"));
	// Re-parse data chunks to preserve pushdata opcodes correctly
	const parsedMapData = Script.fromBinary(mapDataScript.toBinary());
	for (const chunk of parsedMapData.chunks) {
		if (chunk.data != null) {
			mapSuffix.writeBin(chunk.data);
		} else {
			mapSuffix.writeOpCode(chunk.op);
		}
	}

	// -------------------------------------------------------------------
	// 4. Create manifest inscription with MAP suffix
	// -------------------------------------------------------------------
	const manifestInscription = Inscription.create(
		manifestBytes,
		MANIFEST_CONTENT_TYPE,
		{
			scriptPrefix: p2pkhPrefix,
			scriptSuffix: mapSuffix,
		},
	);
	const manifestVout = outputs.length;

	outputs.push({
		lockingScript: Utils.toHex(manifestInscription.lock().toBinary()),
		satoshis: 1,
		outputDescription: "manifest (ord-fs/json)",
		basket: ORDINALS_BASKET,
		tags: [
			"origin",
			`type:${MANIFEST_CONTENT_TYPE}`,
			`app:${metadata.app}`,
			`${metadata.type}:${metadata.name}@${metadata.version}`,
		],
		customInstructions: JSON.stringify({
			protocolID: ONESAT_PROTOCOL,
			keyID,
			name: metadata.name.slice(0, 64),
		}),
	});

	// -------------------------------------------------------------------
	// 5. Submit via wallet.createAction
	// -------------------------------------------------------------------
	const actionArgs = {
		description: `Publish ${metadata.type}: ${metadata.name}@${metadata.version}`,
		outputs,
		options: {
			randomizeOutputs: false,
		},
	};
	stampManagedOutputIds(actionArgs);
	const result = await wallet.createAction(actionArgs);

	if (!result.txid) {
		throw new Error("Package inscription succeeded but no txid was returned");
	}

	// Capture the wallet-returned Atomic BEEF in current 1sat-stack before
	// returning success. This makes the transaction and its package contents
	// immediately available to ORDFS without waiting for passive ingestion.
	let relay: OneSatRelayResult | undefined;
	if (result.tx) {
		try {
			relay = await relayAtomicBeef(Uint8Array.from(result.tx), result.txid);
		} catch (error) {
			// The wallet already broadcast successfully, so propagation remains
			// best-effort and must not turn a completed inscription into a failure.
			console.warn("[1Sat Relay] Failed to relay inscription BEEF:", error);
		}
	} else {
		console.warn(
			"[1Sat Relay] Wallet returned no Atomic BEEF; falling back to txid indexing",
		);
	}

	// Keep the legacy GorillaPool hint for marketplace/search discoverability.
	submitToIndexer(result.txid).catch(() => {});

	const origins = outputs.map((_, i) => `${result.txid}_${i}`);

	return {
		txid: result.txid,
		manifestVout,
		origins,
		relay,
	};
}

/**
 * Convert a BundleItem[] (theme-token's existing format) to PackageFile[] + PackageMapMetadata.
 * Used by inscribeBundle to bridge the old API to the new package system.
 */
export function bundleItemsToPackage(
	items: Array<{
		type: string;
		base64Data: string;
		mimeType: string;
		name?: string;
		metadata?: Record<string, string>;
	}>,
	packageName: string,
	packageDescription: string,
): { files: PackageFile[]; metadata: PackageMapMetadata } {
	// Determine primary type from items — the last item's type determines the package type
	const primaryItem = items[items.length - 1];
	const typeMap: Record<string, string> = {
		theme: "registry:theme",
		block: "registry:block",
		component: "registry:component",
		hook: "registry:hook",
		lib: "registry:lib",
		project: "registry:base",
		file: "registry:file",
	};
	const assetKind: ThemeTokenAssetKind | undefined =
		primaryItem.type === "font" ||
		primaryItem.type === "pattern" ||
		primaryItem.type === "wallpaper" ||
		primaryItem.type === "image"
			? primaryItem.type
			: undefined;

	const requestedType = items.find((item) => item.metadata?.registryType)
		?.metadata?.registryType;
	const candidateType =
		assetKind != null
			? REGISTRY_ASSET_TYPE
			: primaryItem.type === "theme"
				? "registry:theme"
				: requestedType || typeMap[primaryItem.type] || "registry:file";
	if (
		candidateType === LEGACY_THEME_TYPE ||
		!REGISTRY_TYPE_SET.has(candidateType)
	) {
		throw new Error(`Unsupported registry package type: ${candidateType}`);
	}
	const registryType = candidateType as RegistryType;

	const files: PackageFile[] = items.map((item, i) => {
		const ext = mimeToExt(item.mimeType);
		const fileName = item.name || `file-${i}${ext}`;
		return {
			path: fileName,
			content: new Uint8Array(Utils.toArray(item.base64Data, "base64")),
			contentType: item.mimeType,
		};
	});

	const metadata: PackageMapMetadata = {
		app: "theme-token",
		type: registryType,
		name: packageName,
		version: "1.0.0",
		description: packageDescription,
	};

	// Merge any extra metadata from items
	for (const item of items) {
		if (item.metadata) {
			for (const [key, value] of Object.entries(item.metadata)) {
				if (
					key !== "app" &&
					key !== "type" &&
					key !== "name" &&
					key !== "version" &&
					key !== "description" &&
					key !== "registryType" &&
					key !== "displayName"
				) {
					metadata[key] = value;
				}
			}
		}
	}
	if (assetKind) {
		metadata.kind = assetKind;
		metadata.mediaType = primaryItem.mimeType;
	}

	return { files, metadata };
}

function mimeToExt(mime: string): string {
	const map: Record<string, string> = {
		"application/json": ".json",
		"image/svg+xml": ".svg",
		"image/png": ".png",
		"image/jpeg": ".jpg",
		"image/webp": ".webp",
		"font/woff2": ".woff2",
		"font/woff": ".woff",
		"font/ttf": ".ttf",
		"text/css": ".css",
		"text/plain": ".txt",
	};
	return map[mime] || "";
}
