import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const id = process.argv[2];
if (!id) throw new Error('missing id');

const srcRoot = path.resolve('src', id);
const distRoot = path.resolve('dist', id);
fs.mkdirSync(distRoot, { recursive: true });

const repoSrcRoot = '/vercel/sandbox/src';
const aliasPlugin = {
  name: 'alias-at',
  setup(build) {
    build.onResolve({ filter: /^@\// }, (args) => {
      return { path: path.join(repoSrcRoot, args.path.slice(2)) };
    });
  },
};

await build({
  entryPoints: [path.join(srcRoot, 'entry.tsx')],
  outfile: path.join(distRoot, 'bundle.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  sourcemap: 'inline',
  plugins: [aliasPlugin],
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  jsx: 'automatic',
  tsconfig: fs.existsSync('/vercel/sandbox/tsconfig.json') ? '/vercel/sandbox/tsconfig.json' : undefined,
  nodePaths: fs.existsSync('/vercel/sandbox/node_modules') ? ['/vercel/sandbox/node_modules'] : undefined,
});
