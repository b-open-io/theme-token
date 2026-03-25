# CWI Wallet Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate theme-token from the legacy `window.yours` wallet API to the BRC-100 CWI standard using `yours-wallet-provider@4.0.0`, `@bsv/sdk`, and `@1sat/actions`. Both Yours Wallet v4 (extension, `window.CWI`) and 1satwallet.com (popup via `@1sat/connect`) will work through the same interface.

**Architecture:** Replace the custom `YoursWallet` interface and `WalletProvider` hook with `CWIProvider`/`useCWI()` from `yours-wallet-provider@4.0.0`, which provides `WalletInterface` from `@bsv/sdk`. All wallet operations (inscribe, sendBsv, ordinals, listings) go through `@1sat/actions` which takes a `WalletInterface` context. Ordinal metadata for theme/font/pattern identification comes from GorillaPool API by address (already used for marketplace). For 1satwallet.com (no extension), `@1sat/connect`'s `connectWallet()` provides the `WalletInterface` via iframe CWI.

**Tech Stack:** `yours-wallet-provider@4.0.0` (CWIProvider/useCWI), `@bsv/sdk` (WalletInterface, P2PKH, Utils), `@1sat/actions` (inscribe, sendBsv, ordinals, etc.), `@1sat/connect` (1satwallet.com iframe fallback)

**Migration Reference:** `~/code/yours-wallet-provider/.claude/skills/yours-wallet-migration/SKILL.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `yours-wallet-provider@4.0.0`, `@bsv/sdk`, `@1sat/actions`, `@1sat/connect` |
| `src/lib/yours-wallet.ts` | Modify | Keep market/indexer functions, remove `YoursWallet` interface and `window.yours` detection. Add `fetchOrdinalsByAddress()`. |
| `src/lib/wallet-actions.ts` | Create | Wraps `@1sat/actions` for theme-token operations (inscribe, sendBsv, ordinals, listing). Consumes `WalletInterface`. |
| `src/hooks/use-wallet.tsx` | Create | New hook built on `useCWI()` + `@1sat/actions`. Replaces `use-yours-wallet.tsx`. Same context shape for consumers. |
| `src/hooks/use-yours-wallet.tsx` | Modify | Re-export from `use-wallet.tsx` for backward compat (all 35 consumer files keep working) |
| `src/components/providers.tsx` | Modify | Swap `WalletProvider` for `CWIProvider` |
| `src/components/wallet-connect.tsx` | Modify | Update for new hook, remove "not-installed" → Yours download link, add 1Sat popup option |
| `src/lib/list-ordinal.ts` | Modify | Migrate from `getSignatures`/`broadcast` to `@1sat/actions`'s `listOrdinal` |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
cd /Users/satchmo/code/theme-token && bun add yours-wallet-provider@latest @bsv/sdk @1sat/actions @1sat/connect
```

Note: `@bsv/sdk` may already be a transitive dep. `@1sat/actions` depends on `@1sat/templates`, `@1sat/client`, `@1sat/utils` — all pulled in automatically.

- [ ] **Step 2: Verify versions**

```bash
cd /Users/satchmo/code/theme-token && grep -E '"yours-wallet-provider"|"@bsv/sdk"|"@1sat/actions"|"@1sat/connect"' package.json
```

Expected: `yours-wallet-provider` at `^4.0.0`, `@bsv/sdk` at `^2.x`.

- [ ] **Step 3: Verify build still works**

```bash
cd /Users/satchmo/code/theme-token && bun run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add CWI wallet deps (yours-wallet-provider v4, @bsv/sdk, @1sat/actions, @1sat/connect)"
```

---

### Task 2: Add `fetchOrdinalsByAddress()` and clean up `yours-wallet.ts`

**Files:**
- Modify: `src/lib/yours-wallet.ts`

Keep: all market/indexer functions (`fetchMarketListings`, `fetchThemeMarketListings`, `fetchFontMarketListings`, `fetchImageMarketListings`, `fetchOrdinalContent`, `fetchInscription`, `submitToIndexer`, `sendBsv`, fee constants, listing types).

Remove: `YoursWallet` interface, `getYoursWallet()`, `isYoursWalletInstalled()`, `YOURS_WALLET_URL`, the `window.yours` declaration, and all the legacy wallet types that are now in `yours-wallet-provider/types`.

Add: `fetchOrdinalsByAddress()` for enriched ordinal data from GorillaPool.

- [ ] **Step 1: Add `fetchOrdinalsByAddress()`**

Add after the existing `fetchInscription()` function (~line 600):

```typescript
/**
 * Fetch ordinals owned by an address from GorillaPool API.
 * Returns enriched data with origin, MAP metadata, inscription content.
 * Used because BRC-100 listOutputs() returns sparse data without MAP/inscription content.
 */
export async function fetchOrdinalsByAddress(
	address: string,
	limit = 100,
): Promise<Ordinal[]> {
	try {
		const response = await fetch(
			`${ORDINALS_API}/txos/address/${address}/unspent?limit=${limit}&offset=0`,
		);
		if (!response.ok) {
			console.error("[fetchOrdinalsByAddress] API error:", response.status);
			return [];
		}
		return await response.json();
	} catch (err) {
		console.error("[fetchOrdinalsByAddress] Failed:", err);
		return [];
	}
}
```

- [ ] **Step 2: Keep the `Ordinal` type and related types that are referenced by other files**

The `Ordinal`, `PaginatedOrdinalsResponse`, `Addresses`, `Balance`, `SocialProfile`, `InscribeRequest`, `InscribeResponse` types are used throughout the codebase. Keep them in `yours-wallet.ts` for now — they represent the GorillaPool API response shape, not the wallet interface.

- [ ] **Step 3: Mark legacy functions as deprecated but don't remove yet**

Add `@deprecated` JSDoc tags to `getYoursWallet()`, `isYoursWalletInstalled()` so they can be removed in a follow-up after all consumers are migrated.

- [ ] **Step 4: Verify build, commit**

```bash
cd /Users/satchmo/code/theme-token && bun run build 2>&1 | tail -5
git add src/lib/yours-wallet.ts
git commit -m "feat: add fetchOrdinalsByAddress, deprecate legacy wallet functions"
```

---

### Task 3: Create `wallet-actions.ts` — high-level operations on WalletInterface

**Files:**
- Create: `src/lib/wallet-actions.ts`

Wraps `@1sat/actions` for theme-token's specific needs. Takes a `WalletInterface` and provides: inscribeTheme, inscribePattern, inscribeImage, sendPayment, getOwnedOrdinals.

- [ ] **Step 1: Create the file**

```typescript
/**
 * Wallet Actions — high-level operations for theme-token using @1sat/actions
 *
 * All functions accept a WalletInterface from @bsv/sdk (provided by CWI).
 * Operations are performed via @1sat/actions which handle UTXO selection,
 * signing, and broadcasting automatically.
 */

import { PublicKey } from "@bsv/sdk";
import type { WalletInterface } from "@bsv/sdk";
import {
	createContext,
	inscribe,
	sendBsv,
	type OneSatContext,
} from "@1sat/actions";
import { buildThemeMetadata, buildTileMetadata } from "@/lib/asset-metadata";
import { fetchOrdinalsByAddress, submitToIndexer } from "@/lib/yours-wallet";
import type { Ordinal } from "@/lib/yours-wallet";

/**
 * Create an @1sat/actions context from a WalletInterface
 */
export function createWalletContext(wallet: WalletInterface): OneSatContext {
	return createContext(wallet, { chain: "main" });
}

/**
 * Get the ordinal address derived from the wallet's identity
 */
export async function getOrdinalAddress(
	wallet: WalletInterface,
): Promise<string> {
	const { publicKey } = await wallet.getPublicKey({
		protocolID: [2, "wallet"],
		keyID: "ord",
		counterparty: "self",
	});
	return PublicKey.fromString(publicKey).toAddress();
}

/**
 * Get the payment address derived from the wallet's identity
 */
export async function getPaymentAddress(
	wallet: WalletInterface,
): Promise<string> {
	const { publicKey } = await wallet.getPublicKey({
		protocolID: [2, "wallet"],
		keyID: "bsv",
		counterparty: "self",
	});
	return PublicKey.fromString(publicKey).toAddress();
}

/**
 * Get the identity public key
 */
export async function getIdentityKey(
	wallet: WalletInterface,
): Promise<string> {
	const { publicKey } = await wallet.getPublicKey({ identityKey: true });
	return publicKey;
}

/**
 * Get wallet balance in satoshis
 */
export async function getBalance(
	wallet: WalletInterface,
): Promise<{ satoshis: number; bsv: number }> {
	const { outputs } = await wallet.listOutputs({
		basket: "default",
		limit: 10000,
	});
	const satoshis = outputs
		.filter((o) => o.spendable)
		.reduce((sum, o) => sum + o.satoshis, 0);
	return { satoshis, bsv: satoshis / 1e8 };
}

/**
 * Fetch enriched ordinals (themes, fonts, patterns) by querying GorillaPool API
 */
export async function getOwnedOrdinals(
	wallet: WalletInterface,
	limit = 100,
): Promise<Ordinal[]> {
	const ordAddress = await getOrdinalAddress(wallet);
	return fetchOrdinalsByAddress(ordAddress, limit);
}

/**
 * Inscribe a theme token
 */
export async function inscribeTheme(
	wallet: WalletInterface,
	themeJson: string,
): Promise<{ txid: string; rawtx?: string }> {
	const ctx = createWalletContext(wallet);
	const mapData = buildThemeMetadata();
	const result = await inscribe.execute(ctx, {
		base64Content: btoa(themeJson),
		contentType: "application/json",
		map: mapData,
	});
	if (result.error) throw new Error(result.error);
	if (result.txid) {
		submitToIndexer(result.txid).catch(() => {});
	}
	return { txid: result.txid!, rawtx: result.rawtx };
}

/**
 * Inscribe a pattern (SVG tile)
 */
export async function inscribePattern(
	wallet: WalletInterface,
	svg: string,
	metadata?: {
		name?: string;
		author?: string;
		license?: string;
		prompt?: string;
		provider?: string;
		model?: string;
	},
): Promise<{ txid: string; rawtx?: string }> {
	const ctx = createWalletContext(wallet);
	const mapData = buildTileMetadata({
		name: metadata?.name,
		author: metadata?.author,
		license: metadata?.license,
		prompt: metadata?.prompt,
		provider: metadata?.provider,
		model: metadata?.model,
	});
	const result = await inscribe.execute(ctx, {
		base64Content: btoa(svg),
		contentType: "image/svg+xml",
		map: mapData,
	});
	if (result.error) throw new Error(result.error);
	if (result.txid) {
		submitToIndexer(result.txid).catch(() => {});
	}
	return { txid: result.txid!, rawtx: result.rawtx };
}

/**
 * Inscribe an image (wallpaper, icon)
 */
export async function inscribeImage(
	wallet: WalletInterface,
	base64Data: string,
	mimeType: string,
	metadata?: {
		name?: string;
		author?: string;
		license?: string;
		prompt?: string;
		aspectRatio?: string;
		style?: string;
		dimensions?: { width: number; height: number };
	},
): Promise<{ txid: string; rawtx?: string }> {
	const ctx = createWalletContext(wallet);
	const mapData: Record<string, string> = {
		...buildTileMetadata({
			name: metadata?.name,
			author: metadata?.author,
			license: metadata?.license,
			prompt: metadata?.prompt,
		}),
	};
	if (metadata?.aspectRatio) mapData.aspectRatio = metadata.aspectRatio;
	if (metadata?.style) mapData.style = metadata.style;
	if (metadata?.dimensions) {
		mapData.width = String(metadata.dimensions.width);
		mapData.height = String(metadata.dimensions.height);
	}
	const result = await inscribe.execute(ctx, {
		base64Content: base64Data,
		contentType: mimeType,
		map: mapData,
	});
	if (result.error) throw new Error(result.error);
	if (result.txid) {
		submitToIndexer(result.txid).catch(() => {});
	}
	return { txid: result.txid!, rawtx: result.rawtx };
}

/**
 * Send BSV payment
 */
export async function sendPayment(
	wallet: WalletInterface,
	recipientAddress: string,
	amountSatoshis: number,
): Promise<{ txid: string; rawtx?: string }> {
	const ctx = createWalletContext(wallet);
	const result = await sendBsv.execute(ctx, {
		requests: [{ address: recipientAddress, satoshis: amountSatoshis }],
	});
	if (result.error) throw new Error(result.error);
	return { txid: result.txid!, rawtx: result.rawtx };
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/satchmo/code/theme-token && bun run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/wallet-actions.ts
git commit -m "feat: create wallet-actions.ts wrapping @1sat/actions for CWI wallet"
```

---

### Task 4: Create new `use-wallet.tsx` hook

**Files:**
- Create: `src/hooks/use-wallet.tsx`

This hook replaces the core logic of `use-yours-wallet.tsx`. It:
1. Consumes `useCWI()` for `WalletInterface`
2. Uses `wallet-actions.ts` for operations
3. Maintains the same context shape so all 35 consumer files work unchanged
4. Handles 1satwallet.com fallback via `@1sat/connect`'s `connectWallet()`

This is the largest task. The hook mirrors `use-yours-wallet.tsx`'s context value but internally uses CWI.

**NOTE:** This task should be implemented by reading the existing `use-yours-wallet.tsx` line by line and translating each operation. The migration skill at `~/code/yours-wallet-provider/.claude/skills/yours-wallet-migration/SKILL.md` has the exact method mappings.

Key mappings:
- `wallet.connect()` → `wallet.waitForAuthentication()` + `getPublicKey({ identityKey: true })`
- `wallet.getAddresses()` → derive from `getPublicKey()` calls
- `wallet.getBalance()` → `listOutputs({ basket: 'default' })` and sum
- `wallet.getOrdinals()` → `fetchOrdinalsByAddress()` (GorillaPool API)
- `wallet.inscribe()` → `inscribe.execute(ctx, ...)` from `@1sat/actions`
- `wallet.sendBsv()` → `sendBsv.execute(ctx, ...)` from `@1sat/actions`
- `wallet.getSignatures()` + `wallet.broadcast()` → `listOrdinal.execute(ctx, ...)` from `@1sat/actions`

- [ ] **Step 1: Create the hook with full context value matching `use-yours-wallet.tsx`**

The hook must export: `WalletProvider`, `useYoursWallet` (same names for compat), and all the same types (`WalletStatus`, `OwnedTheme`, `OwnedFont`, `OwnedPattern`, `BundleItem`, etc.)

- [ ] **Step 2: Wire up ordinal fetching using GorillaPool API**

Use `getOwnedOrdinals()` from `wallet-actions.ts`, then apply the same categorization logic from `use-yours-wallet.tsx`'s `fetchThemeTokens()`.

- [ ] **Step 3: Wire up inscribe operations using @1sat/actions**

Map `inscribeTheme`, `inscribePattern`, `inscribeImage` to `wallet-actions.ts` functions.

For `inscribeBundle` (multi-output): `@1sat/actions`'s `inscribe` only does single inscriptions. For now, throw an informative error — multi-output bundles will need a custom `createAction()` call or multiple sequential inscriptions. Document this as a known limitation.

- [ ] **Step 4: Wire up payments using @1sat/actions**

Use `sendPayment()` from `wallet-actions.ts`.

- [ ] **Step 5: Handle marketplace listing**

Use `@1sat/actions`'s `listOrdinal` instead of raw `getSignatures`/`broadcast`. This replaces `src/lib/list-ordinal.ts` entirely.

- [ ] **Step 6: Verify build**

```bash
cd /Users/satchmo/code/theme-token && bun run build 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/use-wallet.tsx
git commit -m "feat: new CWI-based wallet hook using @1sat/actions"
```

---

### Task 5: Wire up `use-yours-wallet.tsx` as re-export

**Files:**
- Modify: `src/hooks/use-yours-wallet.tsx`

Replace the entire file with re-exports from `use-wallet.tsx`. This ensures all 35 consumer files continue to work with zero changes.

- [ ] **Step 1: Replace content**

```typescript
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
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/satchmo/code/theme-token && bun run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-yours-wallet.tsx
git commit -m "refactor: use-yours-wallet.tsx re-exports from CWI hook"
```

---

### Task 6: Update `providers.tsx` to use `CWIProvider`

**Files:**
- Modify: `src/components/providers.tsx`

Wrap the app with `CWIProvider` from `yours-wallet-provider` in addition to the existing `WalletProvider` (which now internally uses `useCWI()`).

- [ ] **Step 1: Add CWIProvider**

```tsx
import { CWIProvider } from "yours-wallet-provider";

// In the JSX, wrap WalletProvider with CWIProvider:
<CWIProvider timeout={10_000}>
  <WalletProvider>
    ...
  </WalletProvider>
</CWIProvider>
```

- [ ] **Step 2: Verify build and commit**

```bash
cd /Users/satchmo/code/theme-token && bun run build 2>&1 | tail -10
git add src/components/providers.tsx
git commit -m "feat: add CWIProvider for BRC-100 wallet detection"
```

---

### Task 7: Update `wallet-connect.tsx`

**Files:**
- Modify: `src/components/wallet-connect.tsx`

- Remove the "Desktop Required" mobile dialog — 1satwallet.com popup works everywhere
- Remove the "Install Yours Wallet" link for not-installed state — CWI has a timeout-based availability check
- When `status === "unavailable"`, offer to connect via 1satwallet.com popup
- Keep theme selector and disconnect functionality as-is

- [ ] **Step 1: Update for CWI status model**

The CWI status is `loading | available | unavailable` vs the old `not-installed | disconnected | connecting | connected | error`. Map these in the component.

- [ ] **Step 2: Remove MobileWalletDialog**

No longer needed — 1satwallet.com popup works on mobile.

- [ ] **Step 3: Add 1satwallet.com fallback when CWI unavailable**

When `status === "unavailable"`, show a button that triggers `@1sat/connect`'s `connectWallet()` to open the 1satwallet.com iframe.

- [ ] **Step 4: Verify build and commit**

```bash
cd /Users/satchmo/code/theme-token && bun run build 2>&1 | tail -10
git add src/components/wallet-connect.tsx
git commit -m "feat: update wallet-connect for CWI + 1satwallet.com fallback"
```

---

### Task 8: Clean up `list-ordinal.ts`

**Files:**
- Modify: `src/lib/list-ordinal.ts`

Replace the manual transaction building (which uses legacy `getSignatures`/`broadcast`) with `@1sat/actions`'s `listOrdinal.execute()`.

- [ ] **Step 1: Rewrite using @1sat/actions**

The new implementation is much simpler — `listOrdinal` from `@1sat/actions` handles OrdLock script building, signing, and broadcasting.

- [ ] **Step 2: Verify build and commit**

```bash
cd /Users/satchmo/code/theme-token && bun run build 2>&1 | tail -10
git add src/lib/list-ordinal.ts
git commit -m "refactor: list-ordinal uses @1sat/actions instead of manual tx building"
```

---

### Task 9: Smoke test

- [ ] **Step 1: Start dev server**

```bash
cd /Users/satchmo/code/theme-token && bun dev
```

- [ ] **Step 2: Verify app loads, wallet connection works**

- [ ] **Step 3: Test with Yours Wallet v4 extension (if available)**

- [ ] **Step 4: Test 1satwallet.com popup fallback**

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "chore: smoke test fixes for CWI wallet integration"
```
