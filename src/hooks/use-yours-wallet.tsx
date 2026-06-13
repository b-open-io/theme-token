/**
 * Backward-compatible re-export of the CWI wallet hook.
 * All 35+ consumer files import from this path.
 */
export {
	type BundleAssetType,
	type BundleInscribeResult,
	type BundleItem,
	type MintCollectionItemConfig,
	type OwnedFont,
	type OwnedPattern,
	type OwnedTheme,
	PRISM_PASS_COLLECTION_ID,
	PRISM_PASS_DISCOUNT,
	useYoursWallet,
	WalletProvider,
	type WalletStatus,
} from "./use-wallet";
