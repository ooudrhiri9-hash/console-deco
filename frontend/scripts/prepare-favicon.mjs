/**
 * L'icône de l'onglet, au format que réclament les navigateurs anciens.
 *
 *   public/favicon.svg  ->  public/favicon.ico  (16, 32 et 48 px)
 *
 *   node scripts/prepare-favicon.mjs            (écrit)
 *   node scripts/prepare-favicon.mjs --check    (constate seulement)
 *
 * Le SVG reste l'icône principale : il est net à toutes les tailles et ne pèse
 * rien. Mais un navigateur qui ne sait pas le lire — les anciens Safari, une
 * partie des robots — demande `/favicon.ico` à la racine, par convention et
 * sans qu'aucune balise le lui dise. Sans ce fichier, la réponse est un 404 :
 * neuf en une heure sur le site en ligne le jour où il a été ajouté.
 *
 * Trois tailles dans un seul fichier, parce que c'est ce que le format permet
 * et que chaque usage prend la sienne : 16 px pour l'onglet, 32 px pour la
 * barre des favoris, 48 px pour le raccourci du bureau. Redimensionner un SVG
 * coûte moins que de deviner laquelle suffira.
 *
 * Le conteneur ICO est écrit à la main : il contient des PNG, ce que tout
 * navigateur sorti après 2007 sait lire, et sharp ne sait pas produire d'ICO.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const SRC = resolve('public/favicon.svg');
const OUT = resolve('public/favicon.ico');
const SIZES = [16, 32, 48];
const check = process.argv.includes('--check');

if (!existsSync(SRC)) {
  console.error(`prepare-favicon: ${SRC} introuvable.`);
  process.exit(1);
}

/**
 * Assemble le conteneur : un en-tête de 6 octets, puis une entrée de 16 octets
 * par image, puis les PNG bout à bout. Les décalages ne peuvent être calculés
 * qu'une fois toutes les tailles connues, d'où les deux passes.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // réservé
  header.writeUInt16LE(1, 2); // 1 = icône (2 serait un curseur)
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;

  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    // 0 signifie 256 dans ce format ; aucune de nos tailles n'y arrive.
    e.writeUInt8(size, 0);
    e.writeUInt8(size, 1);
    e.writeUInt8(0, 2); // couleurs de la palette : aucune, l'image est en vraies couleurs
    e.writeUInt8(0, 3); // réservé
    e.writeUInt16LE(1, 4); // plans
    e.writeUInt16LE(32, 6); // bits par pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const images = [];
for (const size of SIZES) {
  images.push({
    size,
    data: await sharp(readFileSync(SRC), { density: 384 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  });
}

const buffer = ico(images);

if (check) {
  const actuel = existsSync(OUT) ? statSync(OUT).size : null;
  console.log(actuel === null
    ? `prepare-favicon: ${OUT} absent — lancer sans --check.`
    : `prepare-favicon: ${OUT} présent, ${actuel} octets (l'exécution en écrirait ${buffer.length}).`);
  process.exit(0);
}

writeFileSync(OUT, buffer);
console.log(`prepare-favicon: ${OUT} — ${SIZES.join(', ')} px, ${buffer.length} octets`);
