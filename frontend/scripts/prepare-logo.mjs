/**
 * Le logo de la marque, et toutes les icônes qui en dérivent.
 *
 *   src/brand/logo.jpg  ->  public/logo-mark.png          (symbole détouré)
 *                       ->  public/logo-mark-reverse.png  (pour fond sombre)
 *                       ->  public/logo.png               (512 px, donnÉes structurées)
 *                       ->  public/apple-touch-icon.png   (180 px, fond opaque)
 *                       ->  public/favicon.ico            (16, 32, 48 px)
 *                       ->  public/og-default.png         (1200x630, partages)
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
/** Le bloc entier, symbole et nom : ce qui part dans les partages. */
const BLOC = { top: 425, bottom: 1111 };
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
async function bornesDuSymbole(bande = SYMBOLE) {
  const { data, info } = await sharp(SRC).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const colonnes = [];
  for (let x = 0; x < W; x += 1) {
    let n = 0;
    for (let y = bande.top; y <= bande.bottom; y += 1) if (data[y * W + x] < 190) n += 1;
    colonnes.push(n);
  }
  const debut = colonnes.findIndex((v) => v > 1);
  const fin = colonnes.length - 1 - [...colonnes].reverse().findIndex((v) => v > 1);
  return { left: debut, right: fin };
}

/** Le symbole sur fond transparent. `reverse` éclaircit les traits sombres. */
async function marque({ reverse = false, bande = SYMBOLE } = {}) {
  const { left, right } = await bornesDuSymbole(bande);
  const marge = 10;
  const brut = await sharp(SRC)
    .extract({
      left: left - marge,
      top: bande.top - marge,
      width: right - left + marge * 2,
      height: bande.bottom - bande.top + marge * 2,
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
const blocInverse = await marque({ reverse: true, bande: BLOC });

/**
 * La carte des partages — WhatsApp, Facebook, LinkedIn.
 *
 * Celle d'avant etait un gabarit assume, et elle arrivait *blanche* : elle
 * dessinait son texte en SVG, or sharp passe par librsvg, qui n'utilise que
 * les polices installees sur la machine. Marcellus n'y etant pas, le texte
 * disparaissait sans la moindre erreur et il ne restait qu'un filet dore.
 *
 * D'ou le parti pris ici : aucune police. Le bloc complet — symbole et nom —
 * existe deja en pixels dans le fichier source, on le compose sur le fond de
 * la marque. Rien a resoudre, rien a installer, le meme rendu partout.
 *
 * Fond sombre : la vignette se detache des deux interfaces de WhatsApp, claire
 * comme sombre, alors qu'un fond blanc s'y fond.
 */
async function carteDePartage() {
  const W = 1200;
  const H = 630;
  const bloc = await sharp(blocInverse)
    .resize({ width: Math.round(W * 0.56), fit: 'inside' })
    .toBuffer();
  const { width, height } = await sharp(bloc).metadata();

  // Un filet dore a 48 px du bord, comme sur la carte precedente : c'est le
  // seul element qu'elle affichait correctement, et il fait la marque.
  const filet = Buffer.from(
    `<svg width="${W}" height="${H}"><rect x="48" y="48" width="${W - 96}" height="${H - 96}" `
    + `fill="none" stroke="#a67c34" stroke-width="2"/></svg>`,
  );

  return sharp({
    create: { width: W, height: H, channels: 4, background: '#14120f' },
  })
    .composite([
      { input: filet, top: 0, left: 0 },
      { input: bloc, top: Math.round((H - height) / 2), left: Math.round((W - width) / 2) },
    ])
    // Sans canal alpha : plusieurs clients de messagerie rendent la
    // transparence en noir plutot que de la composer. Le fond etant deja
    // opaque, on ne perd rien et on retire le piege.
    .flatten({ background: '#14120f' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

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
  ['public/og-default.png', await carteDePartage()],
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
