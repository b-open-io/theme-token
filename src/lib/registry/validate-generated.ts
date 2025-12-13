import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export type GeneratedFile = { path: string; content: string };

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

let cachedDeps: Set<string> | null = null;
let cachedUiComponents: Set<string> | null = null;

function getProjectRoot(): string {
	return process.cwd();
}

function getDependencySet(): Set<string> {
	if (cachedDeps) return cachedDeps;
	const pkgPath = path.join(getProjectRoot(), "package.json");
	const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const deps = new Set<string>([
		...Object.keys(pkg.dependencies ?? {}),
		...Object.keys(pkg.devDependencies ?? {}),
		"react",
		"react-dom",
	]);
	cachedDeps = deps;
	return deps;
}

export function getInstalledPackageNames(): string[] {
	return Array.from(getDependencySet()).sort();
}

function getAvailableUiComponents(): Set<string> {
	if (cachedUiComponents) return cachedUiComponents;
	const uiDir = path.join(getProjectRoot(), "src", "components", "ui");
	const names = new Set<string>();
	try {
		for (const entry of fs.readdirSync(uiDir, { withFileTypes: true })) {
			if (!entry.isFile()) continue;
			if (!entry.name.endsWith(".tsx")) continue;
			names.add(entry.name.replace(/\.tsx$/, ""));
		}
	} catch {
		// Ignore; registry UI validation will be skipped
	}
	cachedUiComponents = names;
	return names;
}

export function getUiComponentNames(): string[] {
	return Array.from(getAvailableUiComponents()).sort();
}

function packageNameFromSpecifier(spec: string): string {
	if (spec.startsWith("@")) {
		const parts = spec.split("/");
		return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
	}
	return spec.split("/")[0] ?? spec;
}

function collectModuleSpecifiers(code: string, filename: string): string[] {
	const source = ts.createSourceFile(
		filename,
		code,
		ts.ScriptTarget.ES2022,
		true,
		filename.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);

	const specs: string[] = [];

	function visit(node: ts.Node) {
		if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
			specs.push(node.moduleSpecifier.text);
		}
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			node.expression.text === "require" &&
			node.arguments.length === 1 &&
			ts.isStringLiteral(node.arguments[0])
		) {
			specs.push(node.arguments[0].text);
		}
		ts.forEachChild(node, visit);
	}

	visit(source);
	return specs;
}

function resolveProjectAtImport(spec: string): boolean {
	const rel = spec.replace(/^@\//, "");
	const base = path.join(getProjectRoot(), "src", rel);

	const candidates = [
		base,
		`${base}.ts`,
		`${base}.tsx`,
		`${base}.js`,
		`${base}.jsx`,
		path.join(base, "index.ts"),
		path.join(base, "index.tsx"),
		path.join(base, "index.js"),
		path.join(base, "index.jsx"),
	];

	return candidates.some((p) => fs.existsSync(p));
}

function normalizePosix(p: string): string {
	return p.replace(/\\/g, "/");
}

function resolveRelativeImport(
	fromFile: string,
	spec: string,
	availableFiles: Set<string>,
): boolean {
	const fromDir = path.posix.dirname(normalizePosix(fromFile));
	const rawTarget = path.posix.normalize(path.posix.join(fromDir, spec));
	const candidates = [
		rawTarget,
		`${rawTarget}.ts`,
		`${rawTarget}.tsx`,
		`${rawTarget}.js`,
		`${rawTarget}.jsx`,
		path.posix.join(rawTarget, "index.ts"),
		path.posix.join(rawTarget, "index.tsx"),
		path.posix.join(rawTarget, "index.js"),
		path.posix.join(rawTarget, "index.jsx"),
	];

	return candidates.some((c) => availableFiles.has(c));
}

export function validateGeneratedRegistryCode(params: {
	files: GeneratedFile[];
	declaredDependencies?: string[];
	registryDependencies?: string[];
}): ValidationResult {
	const { files, declaredDependencies = [], registryDependencies = [] } = params;

	const errors: string[] = [];
	const warnings: string[] = [];

	const deps = getDependencySet();
	const uiComponents = getAvailableUiComponents();

	const availableFiles = new Set(files.map((f) => normalizePosix(f.path)));

	// Validate declared deps list against actual project deps
	for (const dep of declaredDependencies) {
		const pkg = packageNameFromSpecifier(dep);
		if (!deps.has(pkg)) {
			errors.push(`Dependency "${dep}" is not installed in this project`);
		}
	}

	// Validate shadcn registryDependencies against local UI component set
	if (uiComponents.size > 0) {
		for (const dep of registryDependencies) {
			if (!uiComponents.has(dep)) {
				errors.push(
					`registryDependency "${dep}" is not available in src/components/ui (missing ${dep}.tsx)`,
				);
			}
		}
	} else if (registryDependencies.length > 0) {
		warnings.push("Could not verify registryDependencies (missing src/components/ui)");
	}

	for (const file of files) {
		const filename = normalizePosix(file.path);
		const specs = collectModuleSpecifiers(file.content, filename);

		for (const spec of specs) {
			// Disallow next.js runtime imports in registry items (breaks preview & portability)
			if (spec === "next" || spec.startsWith("next/")) {
				errors.push(`[${filename}] Import "${spec}" is not allowed in registry items`);
				continue;
			}

			// Local alias imports
			if (spec.startsWith("@/")) {
				if (!resolveProjectAtImport(spec)) {
					errors.push(
						`[${filename}] Import "${spec}" does not exist in this project`,
					);
				}
				continue;
			}

			// Relative imports must exist in the generated file set
			if (spec.startsWith("./") || spec.startsWith("../")) {
				if (!resolveRelativeImport(filename, spec, availableFiles)) {
					errors.push(
						`[${filename}] Relative import "${spec}" is missing from generated files`,
					);
				}
				continue;
			}

			// Bare package imports must exist in package.json
			const pkg = packageNameFromSpecifier(spec);
			if (!deps.has(pkg)) {
				errors.push(`[${filename}] Package "${pkg}" is not installed`);
			}
		}
	}

	return { valid: errors.length === 0, errors, warnings };
}
