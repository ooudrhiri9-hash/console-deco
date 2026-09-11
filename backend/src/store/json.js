/**
 * File-backed store: everything lives in one JSON document on disk.
 *
 * Purpose is zero-setup development — clone, `npm run seed`, done. It is NOT
 * suitable for a host that wipes its filesystem on every deploy (Render,
 * Vercel, Heroku): the catalogue and every order would vanish. Set MONGODB_URI
 * there and the Mongo store takes over without a single call site changing.
 *
 * The file is re-read whenever its mtime moves, so a `npm run seed` in another
 * terminal is picked up by a running server instead of being masked by a stale
 * in-memory copy.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const EMPTY = { products: [], categories: [], orders: [], messages: [], admins: [], settings: {} };

export function createJsonStore(file) {
  let cache = null;
  let cachedMtime = 0;
  let writing = Promise.resolve();

  function mtime() {
    try {
      return fs.statSync(file).mtimeMs;
    } catch {
      return 0;
    }
  }

  function load() {
    const stamp = mtime();
    if (cache && stamp === cachedMtime) return cache;
    try {
      cache = { ...EMPTY, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    } catch {
      cache = structuredClone(EMPTY);
    }
    cachedMtime = stamp;
    return cache;
  }

  /** Serialised, atomic write: a crash mid-save can never truncate the store. */
  function save() {
    const snapshot = JSON.stringify(cache, null, 2);
    writing = writing.then(async () => {
      await fsp.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fsp.writeFile(tmp, snapshot, 'utf8');
      await fsp.rename(tmp, file);
      cachedMtime = mtime();
    }).catch((e) => {
      console.error('[store] write failed', e);
    });
    return writing;
  }

  const clone = (v) => (v == null ? v : structuredClone(v));

  /** Generic collection helpers, keyed by whichever field identifies the doc. */
  function collection(name, key) {
    return {
      async all() {
        return clone(load()[name]);
      },
      async find(predicate) {
        return clone(load()[name].find(predicate) ?? null);
      },
      async get(value) {
        return clone(load()[name].find((d) => d[key] === value) ?? null);
      },
      async create(doc) {
        load()[name].push(doc);
        await save();
        return clone(doc);
      },
      async update(value, patch) {
        const list = load()[name];
        const i = list.findIndex((d) => d[key] === value);
        if (i === -1) return null;
        list[i] = { ...list[i], ...patch };
        await save();
        return clone(list[i]);
      },
      async remove(value) {
        const list = load()[name];
        const i = list.findIndex((d) => d[key] === value);
        if (i === -1) return false;
        list.splice(i, 1);
        await save();
        return true;
      },
      async replaceAll(docs) {
        load()[name] = structuredClone(docs);
        await save();
      },
    };
  }

  return {
    kind: 'json',
    label: file,
    async connect() {
      await fsp.mkdir(path.dirname(file), { recursive: true });
      load();
    },
    products: collection('products', 'slug'),
    categories: collection('categories', 'id'),
    orders: collection('orders', 'reference'),
    messages: collection('messages', 'id'),
    admins: collection('admins', 'email'),
    settings: {
      async read() {
        return clone(load().settings);
      },
      async write(patch) {
        cache = load();
        cache.settings = { ...cache.settings, ...patch };
        await save();
        return clone(cache.settings);
      },
    },
  };
}
