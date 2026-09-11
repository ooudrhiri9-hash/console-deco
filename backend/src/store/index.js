/**
 * Picks the store from the environment and exposes the one instance the rest
 * of the API uses. MONGODB_URI set means MongoDB; blank means the local JSON
 * file, which is development-only (see store/json.js).
 */
import path from 'node:path';
import { env, ROOT } from '../env.js';
import { createJsonStore } from './json.js';
import { createMongoStore } from './mongo.js';

const uri = env('MONGODB_URI');

export const store = uri
  ? createMongoStore(uri, env('MONGODB_DB', 'atelier_omar'))
  : createJsonStore(path.join(ROOT, '.data', 'db.json'));

export async function connectStore() {
  await store.connect();
  if (store.kind === 'json') {
    console.warn(
      '[store] JSON file store in use (%s). Development only — a host that '
      + 'wipes its disk on deploy will lose the catalogue and every order. '
      + 'Set MONGODB_URI for production.',
      store.label,
    );
  } else {
    console.log('[store] MongoDB connected (%s)', store.label);
  }
  return store;
}
