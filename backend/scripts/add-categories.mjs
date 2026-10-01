/**
 * Crée dans la base les familles de categories.ts qui n'y sont pas encore.
 *
 *   node scripts/add-categories.mjs --check   # liste ce qui manque, n'écrit rien
 *   node scripts/add-categories.mjs           # crée
 *
 * `npm run seed` ne touche plus aux familles dès que la base en contient une :
 * une famille ajoutée à frontend/src/data/categories.ts n'y arriverait jamais.
 * Ce script la crée comme POST /categories. Une famille déjà en base n'est
 * pas modifiée — ses slugs sont des adresses indexées, son ordre et sa photo
 * ont pu être retouchés depuis.
 *
 * Il écrit dans la base que désigne MONGODB_URI (.env.local). Les familles
 * sont figées au build : la nouvelle page n'apparaît qu'après `npm run build`
 * et l'envoi de out/ (voir set-category-image.mjs).
 */
import { env } from '../src/env.js';
import { connectStore, store } from '../src/store/index.js';
import { normaliseCategory } from '../src/lib/category.js';
import { readArray } from './data-files.mjs';

const checkOnly = process.argv.includes('--check');

async function main() {
  if (!env('MONGODB_URI', '')) {
    console.error('MONGODB_URI absent : le script écrirait dans le fichier JSON local, pas dans la base de la boutique.');
    process.exit(1);
  }
  await connectStore();

  const source = await readArray('categories.ts', 'categories');
  let written = 0;

  for (const raw of source) {
    const { error, category } = normaliseCategory(raw, null);
    if (error) {
      console.error(`  ✗ ${raw.id} : ${error}`);
      continue;
    }
    if (await store.categories.get(category.id)) {
      console.log(`  = ${category.id}`);
      continue;
    }
    console.log(`  ${checkOnly ? '?' : '+'} ${category.id} : /produits/${category.slug.fr}/ , /en/products/${category.slug.en}/`);
    if (checkOnly) continue;
    await store.categories.create(category);
    written++;
  }

  console.log(checkOnly ? '\nRien écrit (--check).\n' : `\n${written} famille(s) créée(s).\n`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Échec :', e);
  process.exit(1);
});
