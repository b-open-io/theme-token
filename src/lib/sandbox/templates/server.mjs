import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distRoot = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 3001);

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function contentType(p) {
  if (p.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);

    // GET /<id>/ -> serve an HTML shell that loads /<id>/bundle.js
    if (req.method === 'GET' && parts.length === 1) {
      const id = parts[0];
      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body{margin:0;background:transparent;font-family:system-ui,sans-serif}</style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/${id}/bundle.js"></script>
</body>
</html>`;
      return send(res, 200, { 'content-type': 'text/html; charset=utf-8' }, html);
    }

    // Static: /<id>/<file>
    if (req.method === 'GET' && parts.length >= 2) {
      const id = parts[0];
      const rel = parts.slice(1).join('/');
      const filePath = path.join(distRoot, id, rel);
      if (!filePath.startsWith(path.join(distRoot, id))) {
        return send(res, 400, { 'content-type': 'text/plain; charset=utf-8' }, 'bad path');
      }
      if (!fs.existsSync(filePath)) {
        return send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'not found');
      }
      const data = fs.readFileSync(filePath);
      return send(res, 200, { 'content-type': contentType(filePath) }, data);
    }

    return send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, 'not found');
  } catch (err) {
    return send(res, 500, { 'content-type': 'text/plain; charset=utf-8' }, String(err));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[preview-server] listening on ${port}`);
});
