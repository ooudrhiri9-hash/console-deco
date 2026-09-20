/**
 * Le logo de la marque, et toutes les icônes qui en dérivent.
 *
 *   src/brand/logo.jpg  ->  public/logo-mark.png          (symbole détouré)
 *                       ->  public/logo-mark-reverse.png  (pour fond sombre)
 *                       ->  public/logo.png               (512 px, donnÉes structurées)
 *                       ->  public/apple-touch-icon.png   (180 px, fond opaque)
 *                       ->  public/favicon.ico            (16, 32, 48 px)
 *
 *   node scripts/prepare-logo.mjs            (écrit)
 *   node scripts/prepare-logo.mjs --check    (constate seulement)
 *
 * La source est l'image livrée par le client : un JPEG, symbole au-dessus du
 * mot-symbole, sur papier crème texturé. On n'en garde que le symbole — le nom
 * de la marque est composé en Marcellus dans l'en-tête, ce qui reste net à
 * toutes les tailles et lisible par un lecteur d'écran, ce qu'une image ne fait
 * pas.
 *
 * Deux choses que le fichier source impose :
 *
 * 1. Le fond n'est pas blanc mais crème, et texturé. Un seuil sec laisserait un
 *    halo autour des traits ; la transparence suit donc une rampe entre 205 et
 *    238 de luminance, ce qui garde les bords anti-aliasés.
 * 2. L'arche est tracée en quasi-noir. Posée sur le fond sombre de la marque
 *    (#14120f) elle disparaît, et il ne resterait que le cadre doré. La
 *    variante inversée éclaircit les traits sombres et laisse l'or intact.
 *
 * Limite connue : ce symbole est un trait fin. À 16 px il devient une tache.
 * C'est le prix d'un dessin fin ; un glyphe simplifié pour les petites tailles
 * serait un vrai travail de graphiste, pas un redimensionnement.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const SRC = resolve('src/brand/logo.jpg');
const check = process.argv.includes('--check');

/** Le symbole seul, repéré par analyse du fichier source (voir le journal). */
const SYMBOLE = { top: 425, bottom: 874 };
/** Le fond sombre de la marque, celui du pied de page et de l'icône iOS. */
const ENCRE = '#14120f';
const ICO_SIZES = [16, 32, 48];
const APPLE = 180;
const LOGO = 512;

if (!existsSync(SRC)) {
  console.error(`prepare-logo: ${SRC} introuvable.`);
  process.exit(1);
}

/** Colonnes occupées par le symbole, pour ne pas recadrer à vue. */
async function bornesDuSymbole() {
  const { data, info } = await sharp(SRC).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const colonnes = [];
  for (let x = 0; x < W; x += 1) {
    let n = 0;
    for (let y = SYMBOLE.top; y <= SYMBOLE.bottom; y += 1) if (data[y * W + x] < 190) n += 1;
    colonnes.push(n);
  }
  const debut = colonnes.findIndex((v) => v > 1);
  const fin = colonnes.length - 1 - [...colonnes].reverse().findIndex((v) => v > 1);
  return { left: debut, right: fin };
}

/** Le symbole sur fond transparent. `reverse` éclaircit les traits sombres. */
async function marque({ reverse = false } = {}) {
  const { left, right } = await bornesDuSymbole();
  const marge = 10;
  const brut = await sharp(SRC)
    .extract({
      left: left - marge,
      top: SYMBOLE.top - marge,
      width: right - left + marge * 2,
      height: SYMBOLE.bottom - SYMBOLE.top + marge * 2,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = brut.data;
  for (let i = 0; i < brut.info.width * brut.info.height; i += 1) {
    const o = i * 4;
    const lum = px[o] * 0.299 + px[o + 1] * 0.587 + px[o + 2] * 0.114;
    // Rampe plutôt que seuil : les bords anti-aliasés survivent au détourage.
    px[o + 3] = lum > 238 ? 0 : lum < 205 ? 255 : Math.round((255 * (238 - lum)) / 33);

    if (reverse) {
      // Un trait est « sombre » quand il est peu saturé : l'or, lui, est très
      // saturé et doit rester tel quel, sinon le logo perd sa couleur.
      const max = Math.max(px[o], px[o + 1], px[o + 2]);
      const min = Math.min(px[o], px[o + 1], px[o + 2]);
      const sature = max - min > 40;
      if (!sature && px[o + 3] > 0) {
        px[o] = 246;
        px[o + 1] = 245;
        px[o + 2] = 242;
      }
    }
  }

  return sharp(px, { raw: { width: brut.info.width, height: brut.info.height, channels: 4 } })
    .png()
    .toBuffer()
    .then((b) => sharp(b).trim({ threshold: 1 }).png().toBuffer());
}

/** Conteneur ICO écrit à la main : il porte des PNG, et sharp n'en produit pas. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size, 0);
    e.writeUInt8(size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const claire = await marque();
const inversee = await marque({ reverse: true });

/** Le symbole centré dans un carré, sur fond transparent ou plein. */
const carre = (buffer, taille, fond) =>
  sharp(buffer)
    .resize(Math.round(taille * 0.84), Math.round(taille * 0.84), {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: Math.round(taille * 0.08),
      bottom: Math.round(taille * 0.08),
      left: Math.round(taille * 0.08),
      right: Math.round(taille * 0.08),
      background: fond ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(taille, taille)
    .png({ compressionLevel: 9 })
    .toBuffer();

/**
 * Les versions affichees dans les pages. Le PNG detoure pese 250 Ko : parfait
 * comme source, absurde dans un en-tete present sur chaque page. Le WebP a
 * deux fois la taille d'affichage suffit largement.
 */
const enPage = (buffer, hauteur) =>
  sharp(buffer).resize({ height: hauteur * 2 }).webp({ quality: 88, effort: 6 }).toBuffer();

const sorties = [
  ['public/logo-mark.png', claire],
  ['public/logo-mark-reverse.png', inversee],
  ['public/media/brand/mark-header.webp', await enPage(claire, 34)],
  ['public/media/brand/mark-footer.webp', await enPage(inversee, 30)],
  ['public/logo.png', await carre(claire, LOGO)],
  ['public/apple-touch-icon.png', await carre(inversee, APPLE, ENCRE)],
  [
    'public/favicon.ico',
    ico(await Promise.all(ICO_SIZES.map(async (size) => ({ size, data: await carre(claire, size) })))),
  ],
];

for (const [chemin, data] of sorties) {
  const abs = resolve(chemin);
  if (check) {
    const actuel = existsSync(abs) ? statSync(abs).size : null;
    console.log(
      actuel === null
        ? `prepare-logo: ${chemin} absent — lancer sans --check.`
        : `prepare-logo: ${chemin} présent, ${actuel} octets (l'exécution en écrirait ${data.length}).`,
    );
    continue;
  }
  writeFileSync(abs, data);
  console.log(`prepare-logo: ${chemin.padEnd(34)} ${data.length} octets`);
}
