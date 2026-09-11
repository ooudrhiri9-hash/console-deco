/**
 * Pulls the live catalogue out of the API and freezes it into the build.
 *
 *   node scripts/sync-catalogue.mjs            # best effort, never fails the build
 *   node scripts/sync-catalogue.mjs --strict   # exit 1 if the API cannot be read
 *
 * The pages are static HTML, so this is the moment — and the only moment —
 * where what the owner typed in /admin becomes what a visitor sees. When the
 * API is unreachable the previous snapshot is kept, and if there has never been
 * one the site falls back to src/data/{products,categories}.ts.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src', 'data', 'catalogue.json');
const strict = process.argv.includes('--strict');

/** .env.local wins over .env, neither overrides a real environment variable. */
function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const file = path.join(ROOT, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4400').replace(/\/+$/, '');

const bail = (message) => {
  if (strict) {
    console.error(`sync-catalogue: ${message}`);
    process.exit(1);
  }
  console.warn(`sync-catalogue: ${message}`);
  console.warn(existsSync(OUT)
    ? '  -> snapshot précédent conservé.'
    : '  -> aucun instantané : le site utilisera src/data/*.ts.');
  // A build must still be possible on a laptop with no API running.
  if (!existsSync(OUT)) {
    mkdirSync(path.dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify({ products: [], categories: [], settings: null, generatedAt: null }, null, 2)}\n`, 'utf8');
  }
  process.exit(0);
};

let payload;
try {
  const res = await fetch(`${API}/api/catalogue`, {
    headers: { Accept: 'application/json' },
    // Un service endormi (Render, plan gratuit) met ~50 s a repondre a la
    // premiere requete : 15 s suffisaient en local et faisaient echouer
    // `build:live` en production pour une simple mise en veille.
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) bail(`${API}/api/catalogue a répondu ${res.status}.`);
  payload = await res.json();
} catch (e) {
  bail(`${API} injoignable (${e.message}).`);
}

const products = Array.isArray(payload?.products) ? payload.products : [];
const categories = Array.isArray(payload?.categories) ? payload.categories : [];

// An empty answer is almost always a pointed-at-the-wrong-database mistake.
// Overwriting a good snapshot with it would publish an empty shop.
if (!products.length || !categories.length) {
  bail('réponse vide (0 pièce ou 0 famille) — instantané non remplacé.');
}

const snapshot = {
  products,
  categories: [...categories].sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
  settings: payload.settings ?? null,
  generatedAt: payload.generatedAt || new Date().toISOString(),
  source: API,
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

console.log(`sync-catalogue: ${products.length} pièces, ${categories.length} familles depuis ${API}`);
