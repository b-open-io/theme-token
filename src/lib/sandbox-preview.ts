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
	// Strip ANSI escape sequences that can appear in model output (including CSI with `:` params).
	const ANSI_ESCAPE_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
	return code
		.replace(ANSI_ESCAPE_REGEX, "")
		.replace(/[^\u0009\u000A\u000D\u0020-\u007E\u00A0-\uFFFF]/g, "");
}

type AllowedDeps = {
	versions: Record<string, string>;
};

let allowedDepsCache: AllowedDeps | null = null;

async function getAllowedPreviewDeps(): Promise<AllowedDeps> {
	if (allowedDepsCache) return allowedDepsCache;
	const pkgPath = path.join(process.cwd(), "package.json");
	const raw = await fs.readFile(pkgPath, "utf8");
	const pkg = JSON.parse(raw) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const versions: Record<string, string> = {
		...(pkg.dependencies ?? {}),
		...(pkg.devDependencies ?? {}),
	};
	if (!versions.react) versions.react = "*";
	if (!versions["react-dom"]) versions["react-dom"] = "*";
	if (!versions.esbuild) versions.esbuild = "*";
	allowedDepsCache = { versions };
	return allowedDepsCache;
}

function toPackageName(specifier: string): string | null {
	if (
		specifier.startsWith("node:") ||
		specifier.startsWith(".") ||
		specifier.startsWith("/") ||
		specifier.startsWith("@/")
	) {
		return null;
	}
	const cleaned = specifier.split("?")[0]?.split("#")[0]?.trim();
	if (!cleaned) return null;
	if (cleaned.startsWith("@")) {
		const parts = cleaned.split("/");
		return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
	}
	return cleaned.split("/")[0] ?? null;
}

function extractPackageDepsFromCode(code: string): Set<string> {
	const deps = new Set<string>();
	const patterns: RegExp[] = [
		/\bimport\s+[^;]*?\sfrom\s+['"]([^'"]+)['"]/g,
		/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
		/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
	];
	for (const re of patterns) {
		for (const match of code.matchAll(re)) {
			const spec = match[1];
			if (!spec) continue;
			const pkg = toPackageName(spec);
			if (!pkg) continue;
			deps.add(pkg);
		}
	}
	return deps;
}

async function ensureSandboxDeps(
	sandbox: Sandbox,
	deps: Array<{ name: string; spec: string }>,
): Promise<void> {
	if (deps.length === 0) return;
	const uniqueByName = new Map<string, string>();
	for (const dep of deps) {
		if (!uniqueByName.has(dep.name)) uniqueByName.set(dep.name, dep.spec);
	}
	const unique = Array.from(uniqueByName.entries())
		.slice(0, 25)
		.map(([name, spec]) => ({ name, spec }));
	const depsJson = JSON.stringify(unique);

	const res = await sandbox.runCommand({
		cmd: "bash",
		args: [
			"-lc",
			[
				"set -euo pipefail",
				"cd /vercel/sandbox/.tt-preview",
				`DEPS_JSON='${depsJson.replace(/'/g, "'\\''")}'`,
				"node - <<'NODE'",
				"const fs = require('node:fs');",
				"const path = require('node:path');",
				"const cp = require('node:child_process');",
				"",
				"const requested = JSON.parse(process.env.DEPS_JSON || '[]');",
				"const statePath = path.join(process.cwd(), '.installed-deps.json');",
				"let installed = new Set();",
				"if (fs.existsSync(statePath)) {",
				"  try {",
				"    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));",
				"    if (Array.isArray(parsed)) installed = new Set(parsed);",
				"  } catch {}",
				"}",
				"const missing = requested.filter((d) => d && d.name && !installed.has(d.name));",
				"if (missing.length === 0) process.exit(0);",
				"const specs = missing.map((d) => d.spec || d.name);",
				"console.log('[tt-preview] installing missing deps:', specs.join(' '));",
				"try {",
				"  cp.execFileSync('bun', ['add', '--no-progress', ...specs], { stdio: 'inherit' });",
				"} catch {",
				"  cp.execFileSync('npm', ['install', '--no-audit', '--no-fund', ...specs], { stdio: 'inherit' });",
				"}",
				"for (const d of missing) installed.add(d.name);",
				"fs.writeFileSync(statePath, JSON.stringify(Array.from(installed).sort(), null, 2));",
				"NODE",
				].join("\n"),
			],
		});

	if (res.exitCode !== 0) {
		const stderr = await res.stderr().catch(() => "");
		const stdout = await res.stdout().catch(() => "");
		throw new Error(`Sandbox dependency install failed: ${stderr || stdout || "unknown error"}`);
	}
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
					"echo \"[tt-preview] setup start\"",
					"mkdir -p /vercel/sandbox/.tt-preview/{src,dist}",
					"cd /vercel/sandbox/.tt-preview",
					// Repo deps
					"if [ -f /vercel/sandbox/package.json ] && [ ! -f /vercel/sandbox/.tt-preview/.repo-deps-installed ]; then",
					"  echo \"[tt-preview] installing repo dependencies\"",
					"  cd /vercel/sandbox",
					"  if command -v bun >/dev/null 2>&1; then",
					"    bun install --no-progress",
					"  else",
					"    npm install --no-audit --no-fund",
					"  fi",
					"  touch /vercel/sandbox/.tt-preview/.repo-deps-installed",
					"  cd /vercel/sandbox/.tt-preview",
					"fi",
					// Preview deps
					"echo \"[tt-preview] ensuring preview helper deps\"",
					"if [ ! -f package.json ]; then echo '{\"name\":\"tt-preview\",\"private\":true,\"type\":\"module\"}' > package.json; fi",
					"if [ ! -d node_modules ]; then",
					"  if command -v bun >/dev/null 2>&1; then",
					"    bun add --no-progress react react-dom esbuild",
					"  else",
					"    npm install --no-audit --no-fund react react-dom esbuild",
					"  fi",
					"fi",
					// Start server
					"echo \"[tt-preview] ensuring preview server running\"",
				"if [ -f /tmp/tt-preview-server.pid ] && kill -0 \"$(cat /tmp/tt-preview-server.pid)\" 2>/dev/null; then",
					"  echo \"[tt-preview] server already running\"",
					"else",
					`  PORT=${PORT} nohup node server.mjs >/tmp/preview-server.log 2>&1 & echo $! > /tmp/tt-preview-server.pid`,
					"  echo \"[tt-preview] server started\"",
					"fi",
					"echo \"[tt-preview] setup done\"",
				].join("\n"),
			],
		});

		if (setup.exitCode !== 0) {
			const [stderr, stdout, diag] = await Promise.all([
				setup.stderr().catch(() => ""),
				setup.stdout().catch(() => ""),
				sandbox
					.runCommand({
						cmd: "bash",
						args: [
							"-lc",
							[
								"set -euo pipefail",
								"echo \"[tt-preview] diag start\"",
								"echo \"node: $(node -v 2>/dev/null || true)\"",
								"echo \"npm: $(npm -v 2>/dev/null || true)\"",
								"echo \"pwd: $(pwd)\"",
								"ls -la /vercel/sandbox/.tt-preview || true",
								"ls -la /vercel/sandbox/.tt-preview/src || true",
								"ls -la /vercel/sandbox/.tt-preview/dist || true",
								"echo \"--- /tmp/preview-server.log (tail) ---\"",
								"test -f /tmp/preview-server.log && tail -n 200 /tmp/preview-server.log || true",
								"echo \"[tt-preview] diag done\"",
							].join("\n"),
						],
					})
					.then((r) => r.stdout().catch(() => ""))
					.catch(() => ""),
			]);

			const truncate = (s: string, max = 8000) =>
				s.length > max ? `${s.slice(0, max)}\n...[truncated ${s.length - max} chars]` : s;

			const details = [
				stderr ? `stderr:\n${truncate(stderr)}` : "",
				stdout ? `stdout:\n${truncate(stdout)}` : "",
				diag ? `diag:\n${truncate(diag)}` : "",
			]
				.filter(Boolean)
				.join("\n\n");

			throw new Error(`Sandbox setup failed${details ? `\n\n${details}` : ": unknown error"}`);
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

	// Ensure the sandbox has npm deps needed by the generated code (limited to this repo's deps).
	try {
		const allowed = await getAllowedPreviewDeps();
		const requested = new Set<string>();
		for (const file of params.files) {
			for (const dep of extractPackageDepsFromCode(file.content)) {
				requested.add(dep);
			}
		}
		const depsToInstall = Array.from(requested)
			.map((name) => ({ name, version: allowed.versions[name] }))
			.filter((d) => Boolean(d.version))
			.map((d) => ({ name: d.name, spec: `${d.name}@${d.version}` }));
		await ensureSandboxDeps(sandbox, depsToInstall);
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Sandbox dependency install failed",
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
