/**
 * Zero-dependency preview server for the exported site.
 *
 * It mirrors what public/.htaccess makes Apache do — gzip for text types and
 * the same Cache-Control per extension. Without that, Lighthouse fails
 * `uses-text-compression` and `uses-long-cache-ttl` and under-reports
 * performance by ~15 points against things production actually does.
 *
 *   node scripts/serve-out.mjs [port]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../out/', import.meta.url));
const PORT = Number(process.argv[2] ?? 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt']);
const IMMUTABLE = new Set(['.js', '.css', '.woff2']);
const LONG_CACHE = new Set(['.webp', '.png', '.jpg', '.svg']);

const cacheControl = (ext, path) => {
  // Only the hashed build output is immutable; /api and html must revalidate.
  if (IMMUTABLE.has(ext) && path.includes('/_next/static/')) return 'public, max-age=31536000, immutable';
  if (LONG_CACHE.has(ext)) return 'public, max-age=15552000';
  return 'public, max-age=0, must-revalidate';
};

createServer(async (req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let status = 200;
  let file = join(ROOT, path);

  try {
    const s = await stat(file).catch(() => null);
    if (!s || s.isDirectory()) file = join(ROOT, path, 'index.html');
    var body = await readFile(file);
  } catch {
    status = 404;
    file = join(ROOT, '404.html');
    body = await readFile(file).catch(() => Buffer.from('404'));
  }

  const ext = extname(file);
  const headers = {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Cache-Control': cacheControl(ext, path),
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Accept-Encoding',
  };

  if (COMPRESSIBLE.has(ext) && (req.headers['accept-encoding'] ?? '').includes('gzip')) {
    body = gzipSync(body, { level: 6 });
    headers['Content-Encoding'] = 'gzip';
  }

  headers['Content-Length'] = String(body.length);
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(PORT, () => console.log(`serving out/ on http://localhost:${PORT} (gzip + cache headers)`));
