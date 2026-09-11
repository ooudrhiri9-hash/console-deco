/**
 * Reads .env.local then .env from the backend root, with no dependency.
 *
 * In production the variables come from the host's control panel; this loader
 * exists for local development only and never overwrites a variable that is
 * already set.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');

for (const name of ['.env.local', '.env']) {
  let text;
  try {
    text = fs.readFileSync(path.join(ROOT, name), 'utf8');
  } catch {
    continue; // absent is normal
  }
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

/** Trimmed environment variable, or the fallback when unset/blank. */
export const env = (name, fallback = '') => (process.env[name] || '').trim() || fallback;

export const envInt = (name, fallback) => {
  const n = Number.parseInt(env(name), 10);
  return Number.isFinite(n) ? n : fallback;
};
