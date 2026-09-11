/**
 * Copies the local JSON store into the database MONGODB_URI points at.
 *
 *   node scripts/migrate-to-mongo.mjs            # dry run: says what it would write
 *   node scripts/migrate-to-mongo.mjs --write    # writes
 *
 * Run once, when leaving the development file store for a real database. It
 * carries over the administrator with the SAME password hash, so the login
 * that worked locally still works, plus the catalogue, the settings, the
 * orders and the messages.
 *
 * Safe to re-run: a document already in Mongo is left alone unless --replace
 * is given. Nothing is ever deleted from the JSON file.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { env, ROOT } from '../src/env.js';
import { createMongoStore } from '../src/store/mongo.js';

const write = process.argv.includes('--write');
const replace = process.argv.includes('--replace');

const uri = env('MONGODB_URI');
if (!uri) {
  console.error('MONGODB_URI est vide : rien à migrer vers.');
  process.exit(1);
}

const file = path.join(ROOT, '.data', 'db.json');
let source;
try {
  source = JSON.parse(await fs.readFile(file, 'utf8'));
} catch (e) {
  console.error(`Impossible de lire ${file} : ${e.message}`);
  process.exit(1);
}

const store = createMongoStore(uri, env('MONGODB_DB', 'atelier_omar'));
await store.connect();
console.log(`Base cible : ${store.label}`);

/** One collection: what is already there, what would be added. */
async function copy(name, rows, key) {
  const list = Array.isArray(rows) ? rows : [];
  const existing = await store[name].all();
  const known = new Set(existing.map((d) => d[key]));

  const toAdd = list.filter((d) => !known.has(d[key]));
  const toReplace = replace ? list.filter((d) => known.has(d[key])) : [];

  console.log(
    `${name.padEnd(10)} local ${String(list.length).padStart(3)} | déjà en base ${String(existing.length).padStart(3)}`
    + ` | à créer ${String(toAdd.length).padStart(3)}${replace ? ` | à remplacer ${toReplace.length}` : ''}`,
  );

  if (!write) return;
  for (const doc of toAdd) await store[name].create(doc);
  for (const doc of toReplace) await store[name].update(doc[key], doc);
}

await copy('categories', source.categories, 'id');
await copy('products', source.products, 'slug');
await copy('orders', source.orders, 'reference');
await copy('messages', source.messages, 'id');
await copy('admins', source.admins, 'email');

const currentSettings = await store.settings.read();
const hasSettings = currentSettings && Object.keys(currentSettings).length > 0;
console.log(`settings   ${hasSettings && !replace ? 'déjà en base, conservés' : 'à écrire'}`);
if (write && source.settings && (!hasSettings || replace)) {
  await store.settings.write(source.settings);
}

console.log(write
  ? '\nMigration effectuée.'
  : '\nSimulation seulement. Relancez avec --write pour écrire.');

await store.close?.();
process.exit(0);
