/**
 * Post-export fixups that Next cannot express itself.
 * Runs automatically after `npm run build`.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

let changed = 0;

// 1. The global not-found renders inside Next's own minimal shell, which has
//    no lang attribute (both language root layouts are bypassed for it).
for (const f of ['out/404.html', 'out/404/index.html', 'out/_not-found/index.html']) {
  if (!existsSync(f)) continue;
  const src = readFileSync(f, 'utf8');
  if (src.includes('<html>')) {
    writeFileSync(f, src.replace('<html>', '<html lang="fr">'), 'utf8');
    console.log(`  lang added -> ${f}`);
    changed++;
  }
}

console.log(`postbuild: ${changed} file(s) patched`);
