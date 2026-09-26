/**
 * Catalogue importer: docs/catalogue.csv  ->  src/data/products.ts
 *
 *   npm run import:catalogue                 (reads docs/catalogue.csv)
 *   npm run import:catalogue -- path/to.csv  (reads another file)
 *   npm run import:catalogue -- --check      (validate only, write nothing)
 *
 * Why a generator instead of reading the CSV at runtime: the site is a static
 * export, so the catalogue must be baked into the build. Generating a typed
 * .ts file also means a bad row fails at build time, not in front of a client.
 *
 * The importer is idempotent — running it twice on the same CSV produces a
 * byte-identical file.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CATEGORY_IDS = [
  'consoles',
  'console-tableau',
  'tables-basses',
  'tables-appoint',
  'tableaux',
];

/** Accepts the id, or a few human spellings the client is likely to type. */
const CATEGORY_ALIASES = {
  console: 'consoles',
  consoles: 'consoles',
  'console-tableau': 'console-tableau',
  'console tableau': 'console-tableau',
  ensemble: 'console-tableau',
  ensembles: 'console-tableau',
  'table basse': 'tables-basses',
  'table-basse': 'tables-basses',
  'tables basses': 'tables-basses',
  'tables-basses': 'tables-basses',
  "table d'appoint": 'tables-appoint',
  'table appoint': 'tables-appoint',
  'tables-appoint': 'tables-appoint',
  "tables d'appoint": 'tables-appoint',
  tableau: 'tableaux',
  tableaux: 'tableaux',
};

/**
 * Grille de formats d'une famille (docs/formats-consoles.json) : chaque pièce
 * de la famille la reçoit comme choix « Format ». Le prix de la pièce devient
 * celui du plus petit format, et chaque format porte l'écart avec lui — la
 * forme que lit lib/options.ts et que l'API recalcule à la commande.
 */
const GRID_FILE = new URL('../../docs/formats-consoles.json', import.meta.url);
const grid = existsSync(GRID_FILE) ? JSON.parse(readFileSync(GRID_FILE, 'utf8')) : null;
const gridBase = grid ? Math.min(...grid.formats.map((f) => f.price)) : 0;
const gridOption = grid && {
  ...grid.option,
  values: grid.formats.map((f) => ({
    id: f.id,
    label: { fr: f.label, en: f.label },
    extra: f.price - gridBase,
  })),
};

// ------------------------------------------------------------------ CSV -----
/** Minimal RFC-4180 parser: handles quotes, escaped quotes and embedded \n. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const src = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',' || ch === ';') { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);

const num = (v) => {
  const n = Number(String(v ?? '').replace(/[^\d.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const bool = (v, dflt = false) => {
  const s = String(v ?? '').trim().toLowerCase();
  if (['1', 'oui', 'yes', 'true', 'x', 'vrai'].includes(s)) return true;
  if (['0', 'non', 'no', 'false', 'faux'].includes(s)) return false;
  return dflt;
};
const list = (v) =>
  String(v ?? '')
    .split(/[|;]/)
    .map((s) => s.trim())
    .filter(Boolean);

const q = (s) => JSON.stringify(String(s ?? ''));

// ----------------------------------------------------------------- MAIN -----
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const input = resolve(args.find((a) => !a.startsWith('--')) ?? 'docs/catalogue.csv');
const output = resolve('src/data/products.ts');

if (!existsSync(input)) {
  console.error(`\n✗ No CSV at ${input}`);
  console.error('  Copy docs/catalogue-template.csv, fill it, then run again.\n');
  process.exit(1);
}

const rows = parseCsv(readFileSync(input, 'utf8'));
if (rows.length < 2) {
  console.error('✗ The CSV has a header but no product rows.');
  process.exit(1);
}

const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
const records = rows.slice(1).map((r) => {
  const o = {};
  header.forEach((h, i) => (o[h] = (r[i] ?? '').trim()));
  return o;
});

const errors = [];
const warnings = [];
const seenId = new Map();
const seenSlug = new Map();
const products = [];

records.forEach((r, i) => {
  const line = i + 2; // 1-based, plus the header row
  const where = `line ${line}`;

  const nameFr = r.name_fr || r.nom_fr || r.nom || '';
  const nameEn = r.name_en || r.nom_en || nameFr;
  if (!nameFr) { errors.push(`${where}: name_fr is empty`); return; }

  const id = (r.id || r.reference || r.ref || '').trim();
  if (!id) { errors.push(`${where}: id (SKU) is empty — it must stay stable forever`); return; }
  if (seenId.has(id)) { errors.push(`${where}: duplicate id "${id}" (also ${seenId.get(id)})`); return; }
  seenId.set(id, where);

  const slug = slugify(r.slug || nameFr);
  if (!slug) { errors.push(`${where}: could not build a slug`); return; }
  if (seenSlug.has(slug)) { errors.push(`${where}: duplicate slug "${slug}" (also ${seenSlug.get(slug)})`); return; }
  seenSlug.set(slug, where);

  const rawCat = (r.category || r.categorie || r.catégorie || '').trim().toLowerCase();
  const categoryId = CATEGORY_ALIASES[rawCat] ?? (CATEGORY_IDS.includes(rawCat) ? rawCat : null);
  if (!categoryId) {
    errors.push(`${where}: unknown category "${r.category ?? ''}" — use one of: ${CATEGORY_IDS.join(', ')}`);
    return;
  }

  const gridded = grid?.category === categoryId;
  const price = gridded ? gridBase : num(r.price ?? r.prix);
  if (gridded && num(r.price ?? r.prix) !== gridBase) {
    warnings.push(`${where}: price ${num(r.price ?? r.prix)} ignored — the ${categoryId} size grid sets ${gridBase}`);
  }
  if (price === 0) warnings.push(`${where}: price 0 → the page will show "price on request"`);

  const compare = num(r.compare_at_price ?? r.prix_barre);
  if (compare && compare <= price) {
    warnings.push(`${where}: compare_at_price (${compare}) is not above price (${price}) — no discount badge will show`);
  }

  const images = list(r.images ?? r.image).map((p) => (p.startsWith('/') ? p : `/media/products/${p}`));
  if (!images.length) warnings.push(`${where}: no image → the branded placeholder will be used`);

  const width = num(r.width ?? r.largeur);
  const depth = num(r.depth ?? r.profondeur);
  const height = num(r.height ?? r.hauteur);

  const colorsFr = list(r.colors_fr ?? r.coloris_fr ?? r.coloris);
  const colorsEn = list(r.colors_en ?? r.coloris_en);

  products.push({
    id,
    slug,
    categoryId,
    name: { fr: nameFr, en: nameEn },
    shortDescription: {
      fr: r.short_fr || r.description_courte_fr || '',
      en: r.short_en || r.description_courte_en || r.short_fr || '',
    },
    description: {
      fr: r.description_fr || r.description || '',
      en: r.description_en || r.description_fr || r.description || '',
    },
    price,
    compareAtPrice: compare > price ? compare : undefined,
    images,
    dimensions: width || depth || height ? { width, depth, height } : undefined,
    materials: { fr: r.materials_fr || r.materiaux_fr || '', en: r.materials_en || r.materials_fr || r.materiaux_fr || '' },
    finish:
      r.finish_fr || r.finition_fr
        ? { fr: r.finish_fr || r.finition_fr, en: r.finish_en || r.finish_fr || r.finition_fr }
        : undefined,
    colors: colorsFr.map((c, k) => ({ fr: c, en: colorsEn[k] ?? c })),
    inStock: bool(r.in_stock ?? r.en_stock, true),
    madeToOrder: bool(r.made_to_order ?? r.sur_commande, false),
    leadTimeDays: num(r.lead_time_days ?? r.delai_jours) || undefined,
    featured: bool(r.featured ?? r.mis_en_avant, false),
    options: gridded ? [gridOption] : undefined,
  });
});

// ------------------------------------------------------------- REPORTING ----
for (const w of warnings) console.warn('  ! ' + w);
if (errors.length) {
  console.error('\n✗ Import aborted, nothing was written:\n');
  for (const e of errors) console.error('  ✗ ' + e);
  console.error('');
  process.exit(1);
}

const byCategory = CATEGORY_IDS.map(
  (c) => `${c}: ${products.filter((p) => p.categoryId === c).length}`,
).join(' · ');

if (checkOnly) {
  console.log(`\n✓ ${products.length} products valid (${byCategory}) — nothing written (--check).\n`);
  process.exit(0);
}

// ---------------------------------------------------------------- OUTPUT ----
const loc = (o) => `{ fr: ${q(o.fr)}, en: ${q(o.en)} }`;

const body = products
  .map((p) => {
    const l = [];
    l.push('  {');
    l.push(`    id: ${q(p.id)},`);
    l.push(`    slug: ${q(p.slug)},`);
    l.push(`    categoryId: ${q(p.categoryId)},`);
    l.push(`    name: ${loc(p.name)},`);
    l.push(`    shortDescription: ${loc(p.shortDescription)},`);
    l.push(`    description: ${loc(p.description)},`);
    l.push(`    price: ${p.price},`);
    if (p.compareAtPrice) l.push(`    compareAtPrice: ${p.compareAtPrice},`);
    l.push(`    images: [${p.images.map(q).join(', ')}],`);
    if (p.dimensions) {
      const d = p.dimensions;
      const parts = [];
      if (d.width) parts.push(`width: ${d.width}`);
      if (d.depth) parts.push(`depth: ${d.depth}`);
      if (d.height) parts.push(`height: ${d.height}`);
      l.push(`    dimensions: { ${parts.join(', ')}, unit: 'cm' },`);
    }
    l.push(`    materials: ${loc(p.materials)},`);
    if (p.finish) l.push(`    finish: ${loc(p.finish)},`);
    l.push(`    colors: [${p.colors.map(loc).join(', ')}],`);
    l.push(`    inStock: ${p.inStock},`);
    if (p.madeToOrder) l.push('    madeToOrder: true,');
    if (p.leadTimeDays) l.push(`    leadTimeDays: ${p.leadTimeDays},`);
    if (p.featured) l.push('    featured: true,');
    if (p.options) l.push(`    options: ${JSON.stringify(p.options)},`);
    l.push('  },');
    return l.join('\n');
  })
  .join('\n');

const file = `import type { Product } from '@/types';

/**
 * GENERATED FILE — do not edit by hand.
 * Source: ${input.replace(/\\/g, '/').split('/').slice(-2).join('/')}
 * Regenerate: npm run import:catalogue
 */
export const products: Product[] = [
${body}
];
`;

writeFileSync(output, file, 'utf8');
console.log(`\n✓ ${products.length} products written to src/data/products.ts`);
console.log(`  ${byCategory}`);
if (warnings.length) console.log(`  ${warnings.length} warning(s) above — not blocking.`);
console.log('\n  Next: npm run build\n');
