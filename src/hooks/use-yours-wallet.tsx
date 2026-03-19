/**
 * Backward-compatible re-export of the CWI wallet hook.
 * All 35+ consumer files import from this path.
 */
export {
	WalletProvider,
	useYoursWallet,
	type WalletStatus,
	type OwnedTheme,
	type OwnedFont,
	type OwnedPattern,
	type BundleAssetType,
	type BundleItem,
	type BundleInscribeResult,
	type MintCollectionItemConfig,
	PRISM_PASS_COLLECTION_ID,
	PRISM_PASS_DISCOUNT,
} from "./use-wallet";
