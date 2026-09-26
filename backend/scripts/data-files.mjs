/**
 * Les fichiers de donnees de la boutique, lus depuis les scripts de l'API.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ROOT } from '../src/env.js';

export const DATA_DIR = path.resolve(ROOT, '..', 'frontend', 'src', 'data');

/**
 * Reads one exported array out of a TypeScript data file.
 *
 * These files are plain object literals with a single type annotation, so
 * stripping the annotation and importing the result is enough — and it beats
 * adding a TypeScript toolchain to the API just to read two files once.
 */
export async function readArray(file, name) {
  const source = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
  const start = source.indexOf(`export const ${name}`);
  if (start === -1) throw new Error(`${file}: "export const ${name}" introuvable.`);

  const open = source.indexOf('[', start);
  const end = source.indexOf('\n];', open);
  if (open === -1 || end === -1) throw new Error(`${file}: tableau ${name} mal formé.`);

  const literal = `${source.slice(open, end)}\n];`;
  const tmp = path.join(os.tmpdir(), `omar-seed-${name}-${process.pid}.mjs`);
  await fs.writeFile(tmp, `export default ${literal}\n`, 'utf8');
  try {
    const mod = await import(pathToFileURL(tmp).href);
    return mod.default;
  } finally {
    await fs.rm(tmp, { force: true });
  }
}
