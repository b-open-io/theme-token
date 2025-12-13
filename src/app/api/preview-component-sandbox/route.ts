import ms from "ms";
import { NextResponse } from "next/server";
import { Sandbox } from "@vercel/sandbox";
import { nanoid } from "nanoid";
import { extractComponentName } from "@/lib/sandbox";

export const runtime = "nodejs";
export const maxDuration = 60;

interface PreviewRequest {
	code: string;
	componentName?: string;
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

function hasSandboxAuthEnv(): boolean {
	// Preferred auth: ephemeral OIDC token (locally via `vercel env pull`, on Vercel automatically)
	if (process.env.VERCEL_OIDC_TOKEN) return true;
	// Fallback auth: personal access token + IDs (passed to Sandbox.create via env-aware SDK)
	if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID) {
		return true;
	}
	return false;
}

function getCachedSandbox(): SandboxCacheEntry | undefined {
	const entry = globalThis.__themeTokenPreviewSandbox;
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) return undefined;
	return entry;
}

async function ensureSandbox(): Promise<Sandbox> {
	const cached = getCachedSandbox();
	if (cached) return cached.sandbox;

	const sourceUrl = process.env.SANDBOX_PREVIEW_SOURCE_URL;
	const sandbox = await Sandbox.create({
		source: sourceUrl
			? { type: "git", url: sourceUrl, depth: 1 }
			: undefined,
		ports: [PORT],
		timeout: SANDBOX_TTL_MS,
		runtime: "node24",
		resources: { vcpus: 2 },
	});

	// Bootstrap minimal deps + scripts (idempotent).
	await sandbox.runCommand({
		cmd: "bash",
		args: [
			"-lc",
			[
				"set -euo pipefail",
				"mkdir -p /vercel/sandbox/preview/{src,dist}",
				"cd /vercel/sandbox/preview",
				'if [ ! -f package.json ]; then npm init -y >/dev/null 2>&1; fi',
				'if [ ! -d node_modules ]; then npm install --silent react react-dom esbuild; fi',
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
				"      const html = `<!doctype html>",
				"<html>",
				"<head>",
				"  <meta charset=\\\"utf-8\\\" />",
				"  <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1\\\" />",
				"  <script src=\\\"https://cdn.tailwindcss.com\\\"></script>",
				"  <style>body{margin:0;background:transparent;font-family:system-ui,sans-serif}</style>",
				"</head>",
				"<body>",
				"  <div id=\\\"root\\\"></div>",
				"  <script type=\\\"module\\\" src=\\\"/${id}/bundle.js\\\"></script>",
				"</body>",
				"</html>`;",
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
				"await build({",
				"  entryPoints: [path.join(srcRoot, 'entry.tsx')],",
				"  outfile: path.join(distRoot, 'bundle.js'),",
				"  bundle: true,",
				"  format: 'esm',",
				"  platform: 'browser',",
				"  sourcemap: 'inline',",
				"  loader: { '.ts': 'ts', '.tsx': 'tsx' },",
				"});",
				"EOF",
				"fi",
				// Start server if not already running
				"if ! pgrep -f \"node server.mjs\" >/dev/null 2>&1; then",
				`  PORT=${PORT} nohup node server.mjs >/tmp/preview-server.log 2>&1 &`,
				"fi",
			].join("\n"),
		],
	});

	globalThis.__themeTokenPreviewSandbox = {
		sandbox,
		expiresAt: Date.now() + SANDBOX_TTL_MS,
	};

	return sandbox;
}

export async function POST(request: Request) {
	try {
		if (!hasSandboxAuthEnv()) {
			return NextResponse.json(
				{
					error:
						"Vercel Sandbox auth is missing. Sandbox preview requires `VERCEL_OIDC_TOKEN` (recommended; locally run `vercel link` then `vercel env pull`) or `VERCEL_TOKEN` + `VERCEL_TEAM_ID` + `VERCEL_PROJECT_ID`.",
				},
				{ status: 401 },
			);
		}

		const body = (await request.json()) as PreviewRequest;
		const { code, componentName: providedName } = body;

		if (!code) {
			return NextResponse.json({ error: "Missing component code" }, { status: 400 });
		}

		const componentName = providedName || extractComponentName(code);
		if (!componentName) {
			return NextResponse.json(
				{ error: "Could not determine component name. Please provide componentName." },
				{ status: 400 },
			);
		}

		const sandbox = await ensureSandbox();
		const id = nanoid();

		const entry = [
			"import React from 'react';",
			"import ReactDOM from 'react-dom/client';",
			"",
			code,
			"",
			`const Component = ${componentName};`,
			"const rootEl = document.getElementById('root');",
			"if (!rootEl) throw new Error('Missing #root element');",
			"ReactDOM.createRoot(rootEl).render(",
			"  React.createElement(React.StrictMode, null, React.createElement(Component))",
			");",
		].join("\n");

		await sandbox.writeFiles([
			{
				path: `/vercel/sandbox/preview/src/${id}/entry.tsx`,
				content: Buffer.from(entry, "utf8"),
			},
		]);

		const bundle = await sandbox.runCommand({
			cmd: "bash",
			args: ["-lc", `cd /vercel/sandbox/preview && node bundle.mjs ${id}`],
		});

		if (bundle.exitCode !== 0) {
			const stderr = await bundle.stderr();
			return NextResponse.json(
				{ error: `Sandbox bundling failed: ${stderr || "unknown error"}` },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			url: `${sandbox.domain(PORT)}/${id}/`,
			componentName,
		});
	} catch (error) {
		console.error("[preview-component-sandbox] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to generate sandbox preview" },
			{ status: 500 },
		);
	}
}
