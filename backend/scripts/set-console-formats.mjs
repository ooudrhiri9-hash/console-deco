/**
 * Recopie dans la base les formats et les prix des consoles.
 *
 *   node scripts/set-console-formats.mjs --check   # compare et affiche, n'écrit rien
 *   node scripts/set-console-formats.mjs           # écrit
 *
 * Source : frontend/src/data/products.ts, que `npm run import:catalogue`
 * génère à partir de docs/formats-consoles.json (voir docs/PRIX-CONSOLES.md).
 *
 * Pour chaque console déjà en base, le script écrit le prix, le choix
 * « Format » et les dimensions — retirées quand la largeur devient un choix,
 * sinon l'onglet Détails contredirait le format sélectionné. Pour les pièces
 * de COPY, il reprend aussi nom et textes, qui citaient une largeur fixe.
 * Tout le reste de la fiche — photos, stock, slug, mise en avant — reste où il
 * était. Une console absente de la base y est créée telle que dans le
 * fichier : `npm run seed` ne le ferait pas, il ne touche plus aux pièces dès
 * que la base en contient une seule.
 *
 * Il écrit dans la base que désigne MONGODB_URI (.env.local), celle que sert
 * l'API en ligne : les visiteurs voient les prix au prochain chargement de
 * page, sans build.
 */
import { env } from '../src/env.js';
import { connectStore, store } from '../src/store/index.js';
import { normaliseProduct } from '../src/lib/product.js';
import { readArray } from './data-files.mjs';

/** Pièces dont le nom ou le texte annonçait une seule largeur. */
const COPY = new Set(['CNS-018', 'CNS-024', 'CNS-025', 'CNS-026']);
const TEXT_FIELDS = ['name', 'shortDescription', 'description'];

const checkOnly = process.argv.includes('--check');

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

async function main() {
  if (!env('MONGODB_URI', '')) {
    console.error('MONGODB_URI absent : le script écrirait dans le fichier JSON local, pas dans la base de la boutique.');
    process.exit(1);
  }
  await connectStore();

  const source = (await readArray('products.ts', 'products')).filter((p) => p.options?.length);
  const known = new Set((await store.categories.all()).map((c) => c.id));
  const ids = new Set((await store.products.all()).map((p) => p.id));
  let written = 0;

  for (const file of source) {
    const current = await store.products.get(file.slug);
    if (!current) {
      // Même contrôle que POST /products : la référence est unique, comme le slug.
      const { error, product } = normaliseProduct(file, null, known);
      if (error || ids.has(product.id)) {
        console.error(`  ✗ ${file.id} : ${error || 'référence déjà prise par une autre pièce'}`);
        continue;
      }
      console.log(`  ${checkOnly ? '?' : '+'} ${file.id} ${file.slug} : créée`);
      if (!checkOnly) {
        const now = new Date().toISOString();
        await store.products.create({ ...product, slug: file.slug, createdAt: now, updatedAt: now });
        ids.add(product.id);
        written++;
      }
      continue;
    }

    const patch = { price: file.price, options: file.options };
    if (COPY.has(file.id)) for (const k of TEXT_FIELDS) patch[k] = file[k];

    const { error, product } = normaliseProduct(patch, current, known);
    if (error) {
      console.error(`  ✗ ${file.id} : ${error}`);
      continue;
    }

    // normaliseProduct ne renvoie pas de dimensions absentes, et update() ne
    // fait que $set : sans ce null, l'ancienne largeur resterait en base.
    const dimensions = file.dimensions ?? null;
    const changes = [];
    if (current.price !== product.price) changes.push(`prix ${current.price} → ${product.price}`);
    if (!same(current.options, product.options)) changes.push('formats');
    if (!same(current.dimensions, dimensions)) changes.push('dimensions retirées');
    for (const k of TEXT_FIELDS) {
      if (COPY.has(file.id) && !same(current[k], product[k])) changes.push(k);
    }

    if (!changes.length) {
      console.log(`  = ${file.id} ${file.slug}`);
      continue;
    }
    console.log(`  ${checkOnly ? '?' : '✓'} ${file.id} ${file.slug} : ${changes.join(', ')}`);
    if (checkOnly && COPY.has(file.id)) {
      for (const k of TEXT_FIELDS) {
        if (same(current[k], product[k])) continue;
        console.log(`      ${k}.fr en base : ${JSON.stringify(current[k]?.fr)}`);
        console.log(`      ${k}.fr nouveau : ${JSON.stringify(product[k]?.fr)}`);
      }
    }
    if (checkOnly) continue;

    await store.products.update(current.slug, {
      ...product,
      dimensions,
      updatedAt: new Date().toISOString(),
    });
    written++;
  }

  console.log(checkOnly ? '\nRien écrit (--check).\n' : `\n${written} console(s) mise(s) à jour.\n`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Échec :', e);
  process.exit(1);
});
