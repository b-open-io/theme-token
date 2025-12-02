#!/usr/bin/env bun
/**
 * Theme Token CLI
 * Install ShadCN themes from blockchain
 *
 * Usage:
 *   bunx themetoken add <origin>
 *   bunx themetoken add <txid>
 *   bunx themetoken add <txid>_<vout>
 */

import { spawn } from "child_process";

const REGISTRY_BASE = "https://themetoken.dev/r/themes";
const ORDFS_BASE = "https://ordfs.network";

// Check if input looks like a valid origin/txid
function parseInput(input: string): { origin: string } | null {
  // Remove any URL parts if someone pastes a full URL
  const cleaned = input
    .replace("https://ordfs.network/", "")
    .replace("https://themetoken.dev/r/themes/", "")
    .replace(".json", "")
    .trim();

  // Match txid (64 hex chars) with optional _vout
  const txidPattern = /^[a-f0-9]{64}(_\d+)?$/i;
  if (txidPattern.test(cleaned)) {
    // If no vout, assume _0
    const origin = cleaned.includes("_") ? cleaned : `${cleaned}_0`;
    return { origin };
  }

  return null;
}

async function verifyThemeExists(origin: string): Promise<boolean> {
  try {
    const response = await fetch(`${ORDFS_BASE}/${origin}`);
    if (!response.ok) return false;

    const data = await response.json();
    // Check if it looks like a theme token
    return data.styles && (data.styles.light || data.styles.dark);
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Theme Token CLI - Install ShadCN themes from blockchain

Usage:
  themetoken add <origin>     Install theme by origin ID
  themetoken add <txid>       Install theme by transaction ID (assumes _0)
  themetoken list             List recent themes (coming soon)

Examples:
  themetoken add 85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf_0
  themetoken add 85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf

The theme will be installed using: bunx shadcn@latest add <registry-url>
`);
    process.exit(0);
  }

  const command = args[0];

  if (command === "add") {
    const input = args[1];
    if (!input) {
      console.error("Error: Please provide an origin ID or transaction ID");
      console.error("Usage: themetoken add <origin>");
      process.exit(1);
    }

    const parsed = parseInput(input);
    if (!parsed) {
      console.error("Error: Invalid origin ID or transaction ID format");
      console.error("Expected: 64 character hex string, optionally with _<vout>");
      process.exit(1);
    }

    const { origin } = parsed;
    console.log(`Resolving theme: ${origin}`);

    // Verify the theme exists
    const exists = await verifyThemeExists(origin);
    if (!exists) {
      console.error(`Error: Theme not found at origin ${origin}`);
      console.error(`Checked: ${ORDFS_BASE}/${origin}`);
      process.exit(1);
    }

    const registryUrl = `${REGISTRY_BASE}/${origin}.json`;
    console.log(`Found theme, installing from: ${registryUrl}`);
    console.log("");

    // Run shadcn CLI
    const proc = spawn("bunx", ["shadcn@latest", "add", registryUrl], {
      stdio: "inherit",
    });

    proc.on("exit", (code) => {
      process.exit(code ?? 0);
    });
  }

  if (command === "url") {
    // Just output the registry URL without installing
    const input = args[1];
    if (!input) {
      console.error("Error: Please provide an origin ID or transaction ID");
      process.exit(1);
    }

    const parsed = parseInput(input);
    if (!parsed) {
      console.error("Error: Invalid origin ID or transaction ID format");
      process.exit(1);
    }

    console.log(`${REGISTRY_BASE}/${parsed.origin}.json`);
    process.exit(0);
  }

  if (command === "list") {
    console.log("Coming soon: List recent themes from the marketplace");
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  console.error("Run 'themetoken --help' for usage");
  process.exit(1);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
