/**
 * Sandbox Service
 *
 * Provides safe, isolated execution of AI-generated React components
 * using sandboxed iframes. Components run in isolation with no access
 * to the host system.
 */

/**
 * Create an inline preview using iframe with srcDoc
 * Components are rendered in an isolated iframe with Tailwind CSS
 */
export function createInlinePreviewHtml(
	code: string,
	componentName: string,
): string {
	// Transform TSX to JS (basic transform - strips types)
	const jsCode = transformTsxToJs(code);

	// React 19 removed UMD builds - use ESM via esm.sh
	// See: https://react.dev/blog/2025/10/01/react-19-2
	// Babel standalone latest: https://babeljs.io/docs/babel-standalone
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; background: transparent; }
    #root { min-height: 100vh; }
    .preview-error {
      padding: 1rem;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React from 'https://esm.sh/react@19';
    import ReactDOM from 'https://esm.sh/react-dom@19/client';

    // Make React available globally for Babel-transformed code
    window.React = React;
    window.ReactDOM = ReactDOM;

    try {
      // Transform and execute the component code
      const code = Babel.transform(\`${jsCode.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`, {
        presets: ['react'],
        filename: 'component.jsx'
      }).code;

      // Execute the transformed code
      const executeComponent = new Function('React', 'ReactDOM', code + '; return typeof ${componentName} !== "undefined" ? ${componentName} : null;');
      const Component = executeComponent(React, ReactDOM);

      if (Component) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
          React.createElement(React.StrictMode, null,
            React.createElement('div', { className: 'p-4' },
              React.createElement(Component)
            )
          )
        );
      } else {
        throw new Error('Component "${componentName}" not found');
      }
    } catch (error) {
      document.getElementById('root').innerHTML =
        '<div class="preview-error">Error: ' + error.message + '</div>';
      console.error(error);
    }
  </script>
</body>
</html>`;
}

/**
 * Basic TSX to JS transform (strips TypeScript types)
 * This is a simple regex-based transform for basic cases
 */
function transformTsxToJs(code: string): string {
	return (
		code
			// Remove type imports
			.replace(/import\s+type\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\n?/g, "")
			// Remove type-only import specifiers
			.replace(/,?\s*type\s+\w+/g, "")
			// Remove interface declarations
			.replace(/interface\s+\w+\s*{[^}]*}/g, "")
			// Remove type declarations
			.replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
			// Remove type annotations from function params
			.replace(/:\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*(?=\s*[,)=])/g, "")
			// Remove return type annotations
			.replace(/\):\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*\s*(?=\s*[{=>])/g, ") ")
			// Remove generic type params
			.replace(/<[A-Z]\w*(?:\s*,\s*[A-Z]\w*)*>/g, "")
			// Remove 'as' type assertions
			.replace(/\s+as\s+\w+(\[\])?/g, "")
			// Remove React.FC and similar type annotations
			.replace(/:\s*React\.\w+(<[^>]+>)?/g, "")
			// Clean up empty imports
			.replace(/import\s+{\s*}\s+from\s+['"][^'"]+['"];?\n?/g, "")
	);
}

/**
 * Extract component name from code
 * Looks for: export function Name, export const Name, function Name
 */
export function extractComponentName(code: string): string | null {
	// Match export function ComponentName or export const ComponentName
	const exportMatch = code.match(
		/export\s+(?:default\s+)?(?:function|const)\s+([A-Z]\w*)/,
	);
	if (exportMatch) return exportMatch[1];

	// Match function ComponentName (non-exported)
	const funcMatch = code.match(/function\s+([A-Z]\w*)\s*\(/);
	if (funcMatch) return funcMatch[1];

	// Match const ComponentName = (arrow function)
	const constMatch = code.match(
		/const\s+([A-Z]\w*)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/,
	);
	if (constMatch) return constMatch[1];

	return null;
}
