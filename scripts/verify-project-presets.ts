import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ThemeStyleProps, ThemeToken } from "@theme-token/sdk";
import {
	createProjectManifest,
	ICON_LIBRARY_PACKAGES,
	PROJECT_BASE_PACKAGES,
	type ProjectBase,
	type ProjectPresetConfig,
} from "../src/lib/project-types";

const SHADCN_CLI = "shadcn@4.19.0";
const TIMEOUT_MS = 5 * 60_000;

type Framework = "next" | "vite";

interface MatrixCase {
	framework: Framework;
	base: ProjectBase;
	config: ProjectPresetConfig;
}

const mode = (dark = false): ThemeStyleProps => ({
	background: dark ? "oklch(0.12 0.01 250)" : "oklch(0.98 0.01 250)",
	foreground: dark ? "oklch(0.98 0.01 250)" : "oklch(0.12 0.01 250)",
	card: dark ? "oklch(0.18 0.01 250)" : "oklch(1 0 0)",
	"card-foreground": dark ? "oklch(0.98 0.01 250)" : "oklch(0.12 0.01 250)",
	popover: dark ? "oklch(0.18 0.01 250)" : "oklch(1 0 0)",
	"popover-foreground": dark ? "oklch(0.98 0.01 250)" : "oklch(0.12 0.01 250)",
	primary: "oklch(0.61 0.21 250)",
	"primary-foreground": "oklch(0.98 0.01 250)",
	secondary: "oklch(0.9 0.03 250)",
	"secondary-foreground": "oklch(0.2 0.03 250)",
	muted: "oklch(0.9 0.02 250)",
	"muted-foreground": "oklch(0.5 0.03 250)",
	accent: "oklch(0.8 0.11 190)",
	"accent-foreground": "oklch(0.2 0.03 250)",
	destructive: "oklch(0.6 0.2 25)",
	"destructive-foreground": "oklch(0.98 0.01 25)",
	border: "oklch(0.82 0.03 250)",
	input: "oklch(0.82 0.03 250)",
	ring: "oklch(0.61 0.21 250)",
	radius: "0.5rem",
	"chart-1": "oklch(0.61 0.21 250)",
	"chart-2": "oklch(0.66 0.18 190)",
	"chart-3": "oklch(0.62 0.18 290)",
	"chart-4": "oklch(0.75 0.16 85)",
	"chart-5": "oklch(0.7 0.18 150)",
});

const theme: ThemeToken = {
	$schema: "https://themetoken.dev/v1/schema.json",
	name: "Project Matrix",
	styles: { light: mode(), dark: mode(true) },
};

const configs: Record<ProjectBase, ProjectPresetConfig> = {
	radix: {
		base: "radix",
		style: "sera",
		tailwind: { baseColor: "taupe" },
		iconLibrary: "phosphor",
		font: "noto-sans",
		fontHeading: "playfair-display",
		radius: "large",
		menuColor: "inverted-translucent",
		menuAccent: "bold",
	},
	base: {
		base: "base",
		style: "mira",
		tailwind: { baseColor: "olive" },
		iconLibrary: "remixicon",
		font: "geist",
		fontHeading: "inherit",
		radius: "small",
		menuColor: "default-translucent",
		menuAccent: "subtle",
	},
};

function matrix(): MatrixCase[] {
	if (process.argv.includes("--full")) {
		return (["next", "vite"] as const).flatMap((framework) =>
			(["radix", "base"] as const).map((base) => ({
				framework,
				base,
				config: configs[base],
			})),
		);
	}
	return [
		{ framework: "next", base: "radix", config: configs.radix },
		{ framework: "vite", base: "base", config: configs.base },
	];
}

async function projectText(directory: string): Promise<string> {
	const parts: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (["node_modules", ".git", ".next", "dist"].includes(entry.name))
			continue;
		const path = join(directory, entry.name);
		if (entry.isDirectory()) parts.push(await projectText(path));
		else if (/\.(css|json|tsx?)$/.test(entry.name)) {
			parts.push(await readFile(path, "utf8"));
		}
	}
	return parts.join("\n");
}

async function run(command: string[], cwd: string): Promise<void> {
	const child = spawn(command[0], command.slice(1), {
		cwd,
		env: { ...process.env, CI: "1", NO_COLOR: "1" },
		stdio: ["ignore", "pipe", "pipe"],
	});
	const timer = setTimeout(() => child.kill(), TIMEOUT_MS);
	let stdout = "";
	let stderr = "";
	child.stdout.setEncoding("utf8").on("data", (chunk) => {
		stdout += chunk;
	});
	child.stderr.setEncoding("utf8").on("data", (chunk) => {
		stderr += chunk;
	});
	const [exitCode] = (await once(child, "close")) as [number | null];
	clearTimeout(timer);
	if (exitCode !== 0) {
		throw new Error(
			`Command failed (${exitCode}): ${command.join(" ")}\n${stdout}\n${stderr}`,
		);
	}
}

async function verifyCase(
	temporaryRoot: string,
	serverUrl: string,
	testCase: MatrixCase,
): Promise<void> {
	const name = `${testCase.framework}-${testCase.base}`;
	await run(
		[
			"bunx",
			SHADCN_CLI,
			"create",
			"--preset",
			`${serverUrl}/${name}.json`,
			"--template",
			testCase.framework,
			"--name",
			name,
			"--cwd",
			temporaryRoot,
			"--yes",
			"--no-monorepo",
			"--silent",
		],
		temporaryRoot,
	);

	const projectRoot = join(temporaryRoot, name);
	const components = JSON.parse(
		await readFile(join(projectRoot, "components.json"), "utf8"),
	) as {
		style: string;
		iconLibrary: string;
		menuColor: string;
		menuAccent: string;
		tailwind: { baseColor: string };
	};
	const packageJson = JSON.parse(
		await readFile(join(projectRoot, "package.json"), "utf8"),
	) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const dependencies = {
		...packageJson.dependencies,
		...packageJson.devDependencies,
	};
	const text = await projectText(projectRoot);

	assert.equal(components.style, `${testCase.base}-${testCase.config.style}`);
	assert.equal(components.iconLibrary, testCase.config.iconLibrary);
	assert.equal(components.menuColor, testCase.config.menuColor);
	assert.equal(components.menuAccent, testCase.config.menuAccent);
	assert.equal(
		components.tailwind.baseColor,
		testCase.config.tailwind.baseColor,
	);
	for (const dependency of [
		...PROJECT_BASE_PACKAGES[testCase.base],
		...ICON_LIBRARY_PACKAGES[testCase.config.iconLibrary],
	]) {
		assert.ok(
			dependencies[dependency],
			`${name} did not install ${dependency}`,
		);
	}
	assert.match(text, /oklch\(0\.61 0\.21 250\)/);
	assert.match(
		text,
		new RegExp(testCase.config.radius === "large" ? "0.875rem" : "0.45rem"),
	);
	assert.ok(
		dependencies[testCase.framework === "next" ? "next" : "vite"],
		`${name} is not a ${testCase.framework} fixture`,
	);

	console.log(`verified ${name}`);
}

async function main(): Promise<void> {
	const cases = matrix();
	const manifests = new Map(
		cases.map((testCase) => [
			`/${testCase.framework}-${testCase.base}.json`,
			createProjectManifest(theme, testCase.config),
		]),
	);
	const server = createServer((request, response) => {
		const manifest = manifests.get(
			new URL(request.url ?? "/", "http://127.0.0.1").pathname,
		);
		if (!manifest) {
			response.writeHead(404).end("Not found");
			return;
		}
		response.writeHead(200, { "Content-Type": "application/json" });
		response.end(JSON.stringify(manifest));
	});
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const address = server.address();
	assert.ok(address && typeof address === "object");
	const temporaryRoot = await mkdtemp(join(tmpdir(), "theme-token-presets-"));

	try {
		for (const testCase of cases) {
			await verifyCase(
				temporaryRoot,
				`http://127.0.0.1:${address.port}`,
				testCase,
			);
		}
		console.log(
			`verified ${cases.length} project preset installs with ${SHADCN_CLI}`,
		);
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => (error ? reject(error) : resolve()));
		});
		if (!process.env.KEEP_PROJECT_PRESET_FIXTURES) {
			await rm(temporaryRoot, { recursive: true, force: true });
		} else {
			console.log(`kept fixtures at ${temporaryRoot}`);
		}
	}
}

await main();
