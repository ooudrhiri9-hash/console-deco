/**
 * Donne sa photo d'ambiance à une famille du catalogue.
 *
 *   node scripts/set-category-image.mjs --check          # lit et affiche, n'écrit rien
 *   node scripts/set-category-image.mjs                  # applique les valeurs par défaut
 *   node scripts/set-category-image.mjs tableaux /media/categories/tableaux.webp
 *   node scripts/set-category-image.mjs tableaux ""      # revient à la vignette
 *
 * Les familles n'ont pas d'écran dans /admin : leur fiche ne se modifie que par
 * l'API ou par ici. Ce script écrit le seul champ `image` et laisse le reste de
 * la fiche — noms, slugs, textes, ordre — exactement où il était ; les adresses
 * des pages ne bougent donc jamais.
 *
 * Il écrit dans la base que désigne MONGODB_URI (.env.local), celle-là même que
 * sert l'API en ligne. Contrairement aux pièces, les familles ne sont pas
 * rafraîchies dans le navigateur : les cartes de « Nos collections » sont
 * figées au build. L'ordre est donc :
 *
 *   1. ce script            — la base porte le chemin de la photo
 *   2. npm run build        — l'instantané le reprend, et le .webp part dans out/
 *   3. envoi de out/        — les visiteurs voient la photo
 *
 * Rien ne casse entre les étapes : le site déjà en ligne ne lit pas les
 * familles de la base, il garde ses vignettes jusqu'à ce que le build arrive.
 */
import { env } from '../src/env.js';
import { connectStore, store } from '../src/store/index.js';

/** Ce que prepare-media.mjs écrit pour les familles restées sans photo. */
const DEFAULTS = {
  'console-tableau': '/media/categories/console-tableau.webp',
  tableaux: '/media/categories/tableaux.webp',
};

const args = process.argv.slice(2).filter((a) => a !== '--check');
const checkOnly = process.argv.includes('--check');

async function main() {
  if (!env('MONGODB_URI', '')) {
    console.error('MONGODB_URI absent : le script écrirait dans le fichier JSON local, pas dans la base de la boutique.');
    process.exit(1);
  }
  await connectStore();

  const wanted = args.length ? { [args[0]]: args[1] ?? '' } : DEFAULTS;

  for (const [id, image] of Object.entries(wanted)) {
    const current = await store.categories.get(id);
    if (!current) {
      console.error(`  ✗ ${id} : famille introuvable`);
      continue;
    }
    if (current.image === image) {
      console.log(`  = ${id.padEnd(18)} déjà « ${image || 'aucune photo'} »`);
      continue;
    }
    if (checkOnly) {
      console.log(`  ? ${id.padEnd(18)} « ${current.image || 'aucune photo'} » -> « ${image || 'aucune photo'} »`);
      continue;
    }
    await store.categories.update(id, { ...current, image });
    console.log(`  ✓ ${id.padEnd(18)} « ${current.image || 'aucune photo'} » -> « ${image || 'aucune photo'} »`);
  }

  console.log(checkOnly ? '\nRien écrit (--check).\n' : '\nTerminé.\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('Échec :', e);
  process.exit(1);
});
