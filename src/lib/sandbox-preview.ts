import ms from "ms";
import { Sandbox } from "@vercel/sandbox";
import { nanoid } from "nanoid";

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
	// This avoids leaving behind fragments like `[118;1:3u` which can break parsing/bundling.
	const ANSI_ESCAPE_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
	return code
		.replace(ANSI_ESCAPE_REGEX, "")
		.replace(/[^\t\n\r -~\u00A0-\uFFFF]/g, "");
}

function getCachedSandbox(): SandboxCacheEntry | undefined {
	const entry = globalThis.__themeTokenPreviewSandbox;
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) return undefined;
	return entry;
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

	const setup = await sandbox.runCommand({
		cmd: "bash",
		args: [
			"-lc",
			[
				"set -euo pipefail",
				"mkdir -p /vercel/sandbox/.tt-preview/{src,dist}",
				"cd /vercel/sandbox/.tt-preview",
				// If we seeded from a repo, install its deps once so @/ imports and deps resolve.
				"if [ -f /vercel/sandbox/package.json ] && [ ! -f /vercel/sandbox/.tt-preview/.repo-deps-installed ]; then",
				"  echo \"[tt-preview] installing repo dependencies...\"",
				"  cd /vercel/sandbox",
				"  npm install --silent",
				"  touch /vercel/sandbox/.tt-preview/.repo-deps-installed",
				"  cd /vercel/sandbox/.tt-preview",
				"fi",
				// Ensure preview helper deps
				'if [ ! -f package.json ]; then npm init -y >/dev/null 2>&1; fi',
				'if [ ! -d node_modules ]; then npm install --silent react react-dom esbuild; fi',
				// Tiny static server to host bundles
				'if [ ! -f server.mjs ]; then cat > server.mjs <<\"EOF\"',
				"import http from 'node:http';",
				"import fs from 'node:fs';",
				"import path from 'node:path';",
				"import { fileURLToPath } from 'node:url';",
				"",
				"const __filename = fileURLToPath(import.meta.url);",
				"const __dirname = path.dirname(__filename);",
				"const distRoot = path.join(__dirname, 'dist');",
				"const port = Number(process.env.PORT || 3001);",
				"",
				"function send(res, status, headers, body) {",
				"  res.writeHead(status, headers);",
				"  res.end(body);",
				"}",
				"",
				"function contentType(p) {",
				"  if (p.endsWith('.js')) return 'text/javascript; charset=utf-8';",
				"  if (p.endsWith('.css')) return 'text/css; charset=utf-8';",
				"  if (p.endsWith('.html')) return 'text/html; charset=utf-8';",
				"  return 'application/octet-stream';",
				"}",
				"",
				"const server = http.createServer((req, res) => {",
				"  try {",
				"    const url = new URL(req.url || '/', 'http://localhost');",
				"    const parts = url.pathname.split('/').filter(Boolean);",
				"",
				"    // GET /<id>/ -> serve an HTML shell that loads /<id>/bundle.js",
				"    if (req.method === 'GET' && parts.length === 1) {",
				"      const id = parts[0];",
				"      const html = [",
				"        '<!doctype html>',",
				"        '<html>',",
				"        '<head>',",
				"        '  <meta charset=\"utf-8\" />',",
				"        '  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />',",
				"        '  <script src=\"https://cdn.tailwindcss.com\"></script>',",
				"        '  <style>body{margin:0;background:transparent;font-family:system-ui,sans-serif}</style>',",
				"        '</head>',",
				"        '<body>',",
				"        '  <div id=\"root\"></div>',",
				"        '  <script type=\"module\" src=\"/' + id + '/bundle.js\"></script>',",
				"        '</body>',",
				"        '</html>',",
				"      ].join('\\n');",
				"      return send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, html);",
				"    }",
				"",
				"    // Static: /<id>/<file>",
				"    if (req.method === 'GET' && parts.length >= 2) {",
				"      const id = parts[0];",
				"      const rel = parts.slice(1).join('/');",
				"      const filePath = path.join(distRoot, id, rel);",
				"      if (!filePath.startsWith(path.join(distRoot, id))) {",
				"        return send(res, 400, { 'content-type': 'text/plain; charset=utf-8' }, 'bad path');",
				"      }",
				"      if (!fs.existsSync(filePath)) {",
				"        return send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'not found');",
				"      }",
				"      const data = fs.readFileSync(filePath);",
				"      return send(res, 200, { 'content-type': contentType(filePath) }, data);",
				"    }",
				"",
				"    return send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'not found');",
				"  } catch (err) {",
				"    return send(res, 500, { 'content-type': 'text/plain; charset=utf-8' }, String(err));",
				"  }",
				"});",
				"",
				"server.listen(port, '0.0.0.0', () => {",
				"  console.log(`[preview-server] listening on ${port}`);",
				"});",
				"EOF",
				"fi",
				// Bundler script with @/ alias to repo src
				'if [ ! -f bundle.mjs ]; then cat > bundle.mjs <<\"EOF\"',
				"import { build } from 'esbuild';",
				"import fs from 'node:fs';",
				"import path from 'node:path';",
				"",
				"const id = process.argv[2];",
				"if (!id) throw new Error('missing id');",
				"",
				"const srcRoot = path.resolve('src', id);",
				"const distRoot = path.resolve('dist', id);",
				"fs.mkdirSync(distRoot, { recursive: true });",
				"",
				"const repoSrcRoot = '/vercel/sandbox/src';",
				"const aliasPlugin = {",
				"  name: 'alias-at',",
				"  setup(build) {",
				"    build.onResolve({ filter: /^@\// }, (args) => {",
				"      return { path: path.join(repoSrcRoot, args.path.slice(2)) };",
				"    });",
				"  },",
				"};",
				"",
				"await build({",
				"",
				"  entryPoints: [path.join(srcRoot, 'entry.tsx')],",
				"  outfile: path.join(distRoot, 'bundle.js'),",
				"  bundle: true,",
				"  format: 'esm',",
				"  platform: 'browser',",
				"  sourcemap: 'inline',",
				"  plugins: [aliasPlugin],",
				"  loader: { '.ts': 'ts', '.tsx': 'tsx' },",
				"  define: { 'process.env.NODE_ENV': '\\\"production\\\"' },",
				"  jsx: 'automatic',",
				"  tsconfig: fs.existsSync('/vercel/sandbox/tsconfig.json') ? '/vercel/sandbox/tsconfig.json' : undefined,",
				"  nodePaths: fs.existsSync('/vercel/sandbox/node_modules') ? ['/vercel/sandbox/node_modules'] : undefined,",
				"});",
				"EOF",
				"fi",
				// Start server if not already running
				"if ! pgrep -f \"node server.mjs\" >/dev/null 2>&1; then",
				`  PORT=${PORT} nohup node server.mjs >/tmp/preview-server.log 2>&1 &
`,
				"fi",
			].join("\n"),
		],
	});
	if (setup.exitCode !== 0) {
		const stderr = await setup.stderr();
		throw new Error(`Sandbox setup failed: ${stderr || "unknown error"}`);
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
		return {
			success: false,
			error: `Sandbox bundling failed: ${stderr || "unknown error"}`,
		};
	}

	return { success: true, url: `${sandbox.domain(PORT)}/${id}/` };
}
