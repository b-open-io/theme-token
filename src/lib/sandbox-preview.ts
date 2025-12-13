import ms from "ms";
import { Sandbox } from "@vercel/sandbox";
import { nanoid } from "nanoid";
import fs from "fs/promises";
import path from "path";

export type SandboxPreviewFile = { path: string; content: string };

export interface SandboxPreviewResult {
	success: boolean;
	url?: string;
	error?: string;
}

type SandboxCacheEntry = {
	sandbox: Sandbox;
	expiresAt: number;
};

declare global {
	// eslint-disable-next-line no-var
	var __themeTokenPreviewSandbox: SandboxCacheEntry | undefined;
}

const PORT = 3001;
const SANDBOX_TTL_MS = ms("10m");

export function hasSandboxAuthEnv(): boolean {
	if (process.env.VERCEL_OIDC_TOKEN) return true;
	if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID) {
		return true;
	}
	return false;
}

export function sanitizeCodeForPreview(code: string): string {
	const ANSI_ESCAPE_REGEX = /\x1B(?:[@-Z\\-_]|[[\[0-?]*[ -/]*[@-~])/g;
	return code
		.replace(ANSI_ESCAPE_REGEX, "")
		.replace(/[^\u0009\u000A\u000D\u0020-\u007E\u00A0-\uFFFF]/g, "");
}

function getCachedSandbox(): SandboxCacheEntry | undefined {
	const entry = globalThis.__themeTokenPreviewSandbox;
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) return undefined;
	return entry;
}

async function getTemplateContent(filename: string): Promise<Buffer> {
	const filePath = path.join(process.cwd(), "src/lib/sandbox/templates", filename);
	return fs.readFile(filePath);
}

async function ensureSandbox(): Promise<Sandbox> {
	const cached = getCachedSandbox();
	const sourceUrl = process.env.SANDBOX_PREVIEW_SOURCE_URL;
	const sandbox =
		cached?.sandbox ??
		(await Sandbox.create({
			source: sourceUrl ? { type: "git", url: sourceUrl, depth: 1 } : undefined,
			ports: [PORT],
			timeout: SANDBOX_TTL_MS,
			runtime: "node24",
			resources: { vcpus: 2 },
		}));

	// 1. Read helper scripts from disk
	const [serverMjs, bundleMjs] = await Promise.all([
		getTemplateContent("server.mjs"),
		getTemplateContent("bundle.mjs"),
	]);

	// 2. Write helper scripts directly
	await sandbox.writeFiles([
		{ path: "/vercel/sandbox/.tt-preview/server.mjs", content: serverMjs },
		{ path: "/vercel/sandbox/.tt-preview/bundle.mjs", content: bundleMjs },
	]);

	// 3. Initialize dependencies and start server
	const setup = await sandbox.runCommand({
		cmd: "bash",
		args: [
			"-lc",
			[
				"set -euo pipefail",
				"mkdir -p /vercel/sandbox/.tt-preview/{src,dist}",
				"cd /vercel/sandbox/.tt-preview",
				// Repo deps
				"if [ -f /vercel/sandbox/package.json ] && [ ! -f /vercel/sandbox/.tt-preview/.repo-deps-installed ]; then",
				"  cd /vercel/sandbox",
				"  npm install --silent",
				"  touch /vercel/sandbox/.tt-preview/.repo-deps-installed",
				"  cd /vercel/sandbox/.tt-preview",
				"fi",
				// Preview deps
				'if [ ! -f package.json ]; then npm init -y >/dev/null 2>&1; fi',
				'if [ ! -d node_modules ]; then npm install react react-dom esbuild; fi',
				// Start server
				"if ! pgrep -f \"node server.mjs\" >/dev/null 2>&1; then",
				`  PORT=${PORT} nohup node server.mjs >/tmp/preview-server.log 2>&1 &`,
				"fi",
			].join("\n"),
		],
	});

	if (setup.exitCode !== 0) {
		const stderr = await setup.stderr();
		const stdout = await setup.stdout();
		throw new Error(`Sandbox setup failed: ${stderr || stdout || "unknown error"}`);
	}

	globalThis.__themeTokenPreviewSandbox = { sandbox, expiresAt: Date.now() + SANDBOX_TTL_MS };
	return sandbox;
}

function assertSafeRelativePath(p: string): string {
	const normalized = p.replace(/\\/g, "/").replace(/^\/+/, "");
	if (normalized.includes("..")) {
		throw new Error(`Unsafe file path: ${p}`);
	}
	return normalized;
}

export async function createSandboxPreview(params: {
	files: SandboxPreviewFile[];
	mainFilePath: string;
	componentNameHint?: string;
}): Promise<SandboxPreviewResult> {
	if (!hasSandboxAuthEnv()) {
		return {
			success: false,
			error:
				"Vercel Sandbox auth is missing. Provide `VERCEL_OIDC_TOKEN` (recommended) or `VERCEL_TOKEN` + `VERCEL_TEAM_ID` + `VERCEL_PROJECT_ID`.",
		};
	}

	const sandbox = await ensureSandbox();
	const id = nanoid();

	const mainRel = assertSafeRelativePath(params.mainFilePath);
	const mainImport = `./${mainRel.replace(/\.(tsx|ts|jsx|js)$/, "")}`;

	// If the generated code uses `@/` imports, we need a seeded sandbox with the repo source.
	const needsRepo = params.files.some((f) => /(^|\n)\s*import\s+[^;]*from\s+['"]@\//m.test(f.content));
	if (needsRepo && !process.env.SANDBOX_PREVIEW_SOURCE_URL) {
		return {
			success: false,
			error:
				"Sandbox preview for code that imports from `@/` requires `SANDBOX_PREVIEW_SOURCE_URL` to point at your repo so those imports can resolve.",
		};
	}

	const entry = [
		"import React from 'react';",
		"import ReactDOM from 'react-dom/client';",
		`import * as Mod from '${mainImport}';`,
		"",
		"const rootEl = document.getElementById('root');",
		"if (!rootEl) throw new Error('Missing #root element');",
		"",
		`const hint = ${JSON.stringify(params.componentNameHint ?? "")};`,
		"const named = hint && (Mod as any)[hint] ? (Mod as any)[hint] : null;",
		"const Component = (Mod as any).default || named || (Object.values(Mod as any).find((v) => typeof v === 'function') as any);",
		"if (!Component) throw new Error('No React component export found');",
		"",
		"ReactDOM.createRoot(rootEl).render(",
		"  React.createElement(React.StrictMode, null, React.createElement(Component))",
		");",
	].join("\n");

	const writeFiles: Array<{ path: string; content: Buffer }> = [
		{
			path: `/vercel/sandbox/.tt-preview/src/${id}/entry.tsx`,
			content: Buffer.from(entry, "utf8"),
		},
	];

	for (const file of params.files) {
		const rel = assertSafeRelativePath(file.path);
		writeFiles.push({
			path: `/vercel/sandbox/.tt-preview/src/${id}/${rel}`,
			content: Buffer.from(sanitizeCodeForPreview(file.content), "utf8"),
		});
	}

	await sandbox.writeFiles(writeFiles);

	const bundle = await sandbox.runCommand({
		cmd: "bash",
		args: ["-lc", `cd /vercel/sandbox/.tt-preview && node bundle.mjs ${id}`],
	});

	if (bundle.exitCode !== 0) {
		const stderr = await bundle.stderr();
		const stdout = await bundle.stdout();
		return {
			success: false,
			error: `Sandbox bundling failed: ${stderr || stdout || "unknown error"}`,
		};
	}

	return { success: true, url: `${sandbox.domain(PORT)}/${id}/` };
}