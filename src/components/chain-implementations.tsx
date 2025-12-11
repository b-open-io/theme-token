"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "@/components/code-block";

type Chain = "bsv" | "btc" | "sol" | "bch";

interface ChainInfo {
	name: string;
	fullName: string;
	storage: string;
	cost: string;
	speed: string;
	link: string;
	linkText: string;
	code: string;
	filename: string;
}

const chains: Record<Chain, ChainInfo> = {
	bsv: {
		name: "BSV",
		fullName: "1Sat Ordinals",
		storage: "Full JSON on-chain",
		cost: "~$0.001",
		speed: "Instant",
		link: "https://1satordinals.com",
		linkText: "1satordinals.com",
		filename: "inscribe-bsv.ts",
		code: `import { createOrdinals } from "js-1sat-ord";

const themeToken = { /* Theme Token JSON */ };

await createOrdinals({
  utxos,
  destinations: [{
    address: ownerAddress,
    inscription: {
      dataB64: btoa(JSON.stringify(themeToken)),
      contentType: "application/json",
    },
  }],
  paymentPk,
});`,
	},
	btc: {
		name: "BTC",
		fullName: "Bitcoin Ordinals",
		storage: "Full JSON on-chain",
		cost: "$1-30+",
		speed: "~10 min",
		link: "https://docs.ordinals.com",
		linkText: "docs.ordinals.com",
		filename: "inscribe-btc.ts",
		code: `import * as ordinals from "micro-ordinals";
import { hex, utf8 } from "@scure/base";

const themeToken = { /* Theme Token JSON */ };

const inscription = {
  tags: {
    contentType: "application/json",
  },
  body: utf8.decode(JSON.stringify(themeToken)),
};

// Or use ord CLI:
// ord wallet inscribe --fee-rate 10 \\
//   --content-type application/json \\
//   --file theme-token.json`,
	},
	sol: {
		name: "SOL",
		fullName: "Metaplex Core",
		storage: "URI on-chain, JSON on Arweave",
		cost: "~$0.70",
		speed: "~400ms",
		link: "https://developers.metaplex.com",
		linkText: "developers.metaplex.com",
		filename: "inscribe-sol.ts",
		code: `import { create } from "@metaplex-foundation/mpl-core";
import { generateSigner } from "@metaplex-foundation/umi";

const themeToken = { /* Theme Token JSON */ };

// Upload to Arweave via Irys
const [metadataUri] = await umi.uploader.upload([
  JSON.stringify(themeToken)
]);

// Create NFT with Metaplex Core
const asset = generateSigner(umi);
await create(umi, {
  asset,
  name: themeToken.metadata.name,
  uri: metadataUri,
}).sendAndConfirm(umi);`,
	},
	bch: {
		name: "BCH",
		fullName: "CashTokens + BCMR",
		storage: "40 bytes on-chain + BCMR off-chain",
		cost: "~$0.002",
		speed: "~10 min",
		link: "https://cashtokens.org",
		linkText: "cashtokens.org",
		filename: "inscribe-bch.ts",
		code: `import { Wallet, NFTCapability } from "mainnet-js";

// On-chain: minimal commitment (40 bytes max)
const commitment = Buffer.from(
  JSON.stringify({ id: 1, v: "1.0" })
).toString("hex").substring(0, 80);

const genesis = await wallet.tokenGenesis({
  cashaddr: wallet.cashaddr,
  commitment,
  capability: NFTCapability.none,
  value: 1000,
});

// Off-chain: full Theme Token in BCMR
// Host at: /.well-known/bitcoin-cash-metadata-registry.json
const bcmr = {
  version: 2,
  identities: {
    [genesis.tokenIds[0]]: {
      extensions: { themeToken: { /* full JSON */ } }
    }
  }
};`,
	},
};

export function ChainImplementations() {
	const [activeChain, setActiveChain] = useState<Chain>("bsv");
	const chain = chains[activeChain];

	return (
		<div>
			{/* Chain Tabs */}
			<div className="mb-6 flex flex-wrap gap-2">
				{(Object.keys(chains) as Chain[]).map((key) => (
					<button
						type="button"
						key={key}
						onClick={() => setActiveChain(key)}
						className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
							activeChain === key
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
						}`}
					>
						{chains[key].name}
						<span className="ml-2 hidden text-xs opacity-70 sm:inline">
							{chains[key].fullName}
						</span>
					</button>
				))}
			</div>

			{/* Code Block */}
			<motion.div
				key={activeChain}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
				className="rounded-xl border border-border bg-card overflow-hidden"
			>
				<div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
					<div className="flex items-center gap-2">
						<div className="traffic-close h-3 w-3 rounded-full" />
						<div className="traffic-minimize h-3 w-3 rounded-full" />
						<div className="traffic-maximize h-3 w-3 rounded-full" />
						<span className="ml-2 font-mono text-xs text-muted-foreground">
							{chain.filename}
						</span>
					</div>
					<a
						href={chain.link}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
					>
						{chain.linkText}
						<ExternalLink className="h-3 w-3" />
					</a>
				</div>
				<CodeBlock
					code={chain.code}
					language="typescript"
					className="h-[320px] border-none rounded-none bg-transparent"
					showCopy={true}
				/>
			</motion.div>

			{/* Stats */}
			<div className="mt-6 grid gap-4 sm:grid-cols-3">
				<div className="rounded-lg border border-border bg-card p-4">
					<div className="mb-1 text-xs text-muted-foreground">Storage</div>
					<div className="font-medium">{chain.storage}</div>
				</div>
				<div className="rounded-lg border border-border bg-card p-4">
					<div className="mb-1 text-xs text-muted-foreground">
						Cost per token
					</div>
					<div className="font-mono text-xl font-bold text-primary">
						{chain.cost}
					</div>
				</div>
				<div className="rounded-lg border border-border bg-card p-4">
					<div className="mb-1 text-xs text-muted-foreground">Finality</div>
					<div className="font-medium">{chain.speed}</div>
				</div>
			</div>

		</div>
	);
}
