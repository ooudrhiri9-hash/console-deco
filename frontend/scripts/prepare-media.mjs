/**
 * Product photos: src/products/**  ->  public/media/products/*.webp
 * Family photos:  src/products/**  ->  public/media/categories/*.webp
 *
 *   node scripts/prepare-media.mjs            (write)
 *   node scripts/prepare-media.mjs --check    (report only)
 *
 * The client sends WhatsApp photos in every aspect ratio; the catalogue grid
 * and the product page both use a 4:5 well with object-fit: cover, so an
 * un-normalised photo would be cropped at random. Everything is therefore
 * baked to exactly 800x1000 here, once, at prep time:
 *
 *   - taller than 4:5      -> centre crop (only ceiling/floor is lost)
 *   - slightly wider       -> centre crop (< 10% of the width; the piece is
 *                             always centred in the frame, so it survives)
 *   - much wider (photo)   -> the outer rows of pixels are copied outwards.
 *                             These are plain wall and plain floor, so the
 *                             extension is invisible - and nothing is lost.
 *   - much wider (a client technical drawing) -> letterboxed on its own paper
 *                             colour, because copying a dimension line
 *                             outwards would smear it.
 *
 * MAP is the record of which raw file became which product photo. Keep it in
 * sync with docs/catalogue.csv: the file names encode the product slug.
 */
import { readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import sharp from 'sharp';

const W = 800;
const H = 1000;
/** Above this ratio, a centre crop would start eating the furniture itself. */
const MAX_CROP_RATIO = 0.88;

const SRC = resolve('src/products');
const CONSOLES = join(SRC, 'console-products');
const OUT = resolve('public/media/products');

/**
 * La photo d'une famille n'est lue qu'a un seul endroit, la carte de
 * « Nos collections », et cette carte est un paysage 3:2.2 — pas le puits 4:5
 * du catalogue. On la taille donc a sa mesure : recadrer un portrait 4:5 en
 * CSS ne garderait que la bande du milieu, ce qui coupe soit le tableau soit
 * la console, c'est-a-dire le sujet.
 */
const CAT_W = 800;
const CAT_H = 587;
const CAT_OUT = resolve('public/media/categories');

const wa = (t) => join(CONSOLES, `WhatsApp Image 2026-09-01 at ${t}.jpeg`);
const wa4 = (t) => join(SRC, `WhatsApp Image 2026-09-04 at ${t}.jpeg`);
// Envoi du 23/09 : surtout un renvoi du lot du 01/09. Seules les photos
// nouvelles ont ete gardees — trois angles de pieces existantes, deux pieces.
const wa23 = (t) => join(CONSOLES, `WhatsApp Image 2026-09-23 at ${t}.jpeg`);

/** slug -> source files, in display order. The first one is the card thumbnail. */
const MAP = {
  'console-visages-polychromes': [wa('21.45.44')],
  'console-courbes-terre-et-sauge': [wa('21.45.44 (1)'), wa23('21.39.52 (7)')],
  'console-visages-au-trait': [wa('21.45.44 (2)')],
  'console-visages-sepia': [wa('21.45.45'), wa('21.45.45 (1)')],
  'console-arcs-camel-et-noir': [wa('21.45.45 (4)'), wa('21.45.45 (2)'), wa('21.45.45 (5)')],
  'console-arcs-noir-et-blanc': [wa('21.45.45 (3)')],
  'console-couronne': [wa('21.45.45 (6)')],
  'console-feuillage-beige-et-noir': [wa('21.45.46'), wa('21.45.46 (3)')],
  'console-calligraphie': [wa('21.45.46 (1)')],
  'console-patine-terracotta': [wa('21.45.46 (4)'), wa('21.45.46 (2)'), wa('21.45.46 (5)')],
  'console-patine-or-et-noir': [wa('21.45.46 (6)'), wa23('21.39.52 (17)')],
  'console-arcades-vert-et-terracotta': [wa('21.45.46 (7)'), wa23('21.39.52 (13)')],
  'console-petales-noir-et-craie': [wa('21.45.46 (8)')],
  'console-demi-lunes': [wa('21.45.47'), wa('21.45.47 (1)')],
  'console-arcades-bleu-et-craie': [wa('21.45.47 (2)'), wa('21.45.47 (4)')],
  'console-motifs-berberes': [wa('21.45.47 (3)')],
  'commode-zellige-bleu': [wa('21.45.47 (5)')],
  'console-motifs-africains-noyer': [wa('21.45.47 (6)')],
  'console-carreaux-terre-cuite': [wa('21.45.47 (7)'), wa('21.45.48 (2)')],
  'console-pointilles-chene': [wa('21.45.47 (8)'), wa('21.45.48')],
  'console-fleurs-marqueterie-bleue': [wa('21.45.48 (1)')],
  'console-symboles-terres': [wa('21.46.54 (2)'), wa('21.46.54')],
  'console-visages-cubistes': [wa('21.46.54 (1)')],
  'console-damier-noir-et-blanc-140': [wa('21.46.54 (3)'), wa4('01.39.35')],
  'console-damier-noir-150': [wa4('01.39.38')],
  'console-damier-beige-160': [wa4('01.44.33')],
  'console-pastilles-chene': [wa23('21.39.53 (2)')],
  'console-pointilles-pieds-bois': [wa23('21.39.53 (3)')],
  'table-basse-damier': [join(SRC, 'Tables Basses.jpeg'), join(SRC, 'Tables Basses-1.jpeg')],
};

/**
 * id de famille -> photo d'ambiance. Les deux familles encore vides du
 * catalogue montraient une vignette « ATELIER OMAR » : une collection annoncee
 * sur l'accueil sans rien a regarder. Ces deux photos existaient deja dans le
 * dossier de depot sans qu'aucune piece les reclame.
 *
 * `tables-appoint` n'y figure pas : aucune photo de table d'appoint n'a encore
 * ete fournie, et emprunter celle d'une table basse ferait passer une famille
 * pour une autre. Elle garde sa vignette jusqu'a la vraie photo.
 */
const CATEGORY_MAP = {
  // Un tableau et la console dessous : l'ensemble, en une image.
  'console-tableau': join(SRC, 'Tableau.jpeg'),
  // Une toile seule au-dessus d'un canape : la famille generale. Elle montrait
  // les trois toiles avant que le trio ait sa propre famille — deux cartes
  // auraient alors porte la meme photo, et le visiteur n'aurait pas su ce qui
  // les distingue.
  tableaux: join(SRC, 'Tableau rectangulaire.jpeg'),
  // Deux toiles cote a cote, composition unique.
  'tableaux-duo': join(SRC, 'Tableaux 2 pack.jpeg'),
  // Trois toiles alignees : le format qui tient un mur entier.
  'tableaux-trio': join(SRC, 'Tableau 3 pack.jpeg'),
};

/** Client drawings and product sheets: they carry text, so never copy-extend. */
const SHEETS = new Set([
  wa4('01.39.35'),
  wa4('01.39.38'),
  wa4('01.44.33'),
  join(SRC, 'Tables Basses-1.jpeg'),
]);

/**
 * Captures d'ecran : la bordure noire du telephone et le bouton de l'appli
 * passeraient tels quels dans la photo. On les coupe avant tout le reste.
 */
const TRIM = {
  // Bandes noires de 11 px a gauche et a droite, bouton en bas a droite ;
  // les pieds s'arretent vers y = 1175.
  [wa23('21.39.53 (3)')]: { left: 12, top: 0, width: 1146, height: 1200 },
};

const checkOnly = process.argv.includes('--check');

/** Paper / wall colour, read from a corner the subject never reaches. */
async function cornerColour(file) {
  const { data } = await sharp(file)
    .extract({ left: 1, top: 1, width: 12, height: 12 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0;
  let g = 0;
  let b = 0;
  const px = data.length / 3;
  for (let i = 0; i < data.length; i += 3) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: Math.round(r / px), g: Math.round(g / px), b: Math.round(b / px) };
}

async function convert(source, dest, w = W, h = H) {
  const file = TRIM[source] ? await sharp(source).extract(TRIM[source]).toBuffer() : source;
  const meta = await sharp(file).metadata();
  const ratio = meta.width / meta.height;
  const wanted = w / h;

  // Une cible paysage (les familles) n'a pas le probleme du puits 4:5 : une
  // photo de piece est toujours plus haute que large, donc le recadrage centre
  // ne mord que le plafond et le sol.
  if (wanted >= 1) {
    if (!checkOnly) {
      await sharp(file)
        .resize(w, h, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80, effort: 5 })
        .toFile(dest);
    }
    return `crop      ${ratio.toFixed(2)}`;
  }

  if (ratio <= MAX_CROP_RATIO) {
    if (!checkOnly) {
      await sharp(file)
        .resize(w, h, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80, effort: 5 })
        .toFile(dest);
    }
    return `crop      ${ratio.toFixed(2)}`;
  }

  if (SHEETS.has(source)) {
    const background = await cornerColour(file);
    if (!checkOnly) {
      await sharp(file)
        .resize(w, h, { fit: 'contain', background })
        .webp({ quality: 80, effort: 5 })
        .toFile(dest);
    }
    return `letterbox ${ratio.toFixed(2)}`;
  }

  // Fit the full width, then grow back to 4:5 by copying the top row upwards.
  // Upwards only: the top of these frames is always plain wall, which copies
  // invisibly, whereas copying the bottom row smears the floor or the rug into
  // vertical streaks.
  const fitted = await sharp(file).resize({ width: w }).toBuffer();
  const fittedHeight = (await sharp(fitted).metadata()).height;
  const short = Math.max(0, h - fittedHeight);
  if (!checkOnly) {
    // Deux passes : dans une seule chaine, sharp redimensionne toujours avant
    // d'etendre, quel que soit l'ordre d'appel — la photo etait zoomee et
    // rognee sur les cotes, puis sortait en 800x1100 ou 800x1200.
    const extended = await sharp(fitted).extend({ top: short, extendWith: 'copy' }).toBuffer();
    await sharp(extended)
      .resize(w, h, { fit: 'cover' })
      .webp({ quality: 80, effort: 5 })
      .toFile(dest);
  }
  return `extend    ${ratio.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
const absent = [];
for (const files of Object.values(MAP)) {
  for (const f of files) if (!existsSync(f)) absent.push(f);
}
for (const f of Object.values(CATEGORY_MAP)) if (!existsSync(f)) absent.push(f);
if (absent.length) {
  console.error('\n! Source photo(s) not found:\n' + absent.map((m) => '  x ' + m).join('\n') + '\n');
  process.exit(1);
}

if (!checkOnly) {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(CAT_OUT, { recursive: true });
}

let count = 0;
let bytes = 0;
for (const [slug, files] of Object.entries(MAP)) {
  for (let i = 0; i < files.length; i++) {
    const name = `${slug}-${i + 1}.webp`;
    const dest = join(OUT, name);
    const how = await convert(files[i], dest);
    if (!checkOnly) bytes += statSync(dest).size;
    console.log(`  ${name.padEnd(44)} ${how}`);
    count++;

    // Variante moitie pour les cartes. Une carte du catalogue fait 200 a 400 px
    // de large ; servir le 800x1000 de la fiche produit a chacune faisait
    // telecharger quatre fois les pixels affiches — 129 Ko sur l'accueil seule,
    // mesures par Lighthouse.
    const half = join(OUT, `${slug}-${i + 1}-400.webp`);
    if (!checkOnly) {
      await sharp(dest).resize(W / 2, H / 2).webp({ quality: 78, effort: 5 }).toFile(half);
      bytes += statSync(half).size;
    }
    count++;
  }
}

for (const [id, file] of Object.entries(CATEGORY_MAP)) {
  const name = `${id}.webp`;
  const dest = join(CAT_OUT, name);
  const how = await convert(file, dest, CAT_W, CAT_H);
  if (!checkOnly) bytes += statSync(dest).size;
  console.log(`  ${name.padEnd(44)} ${how} (famille)`);
  count++;

  const half = join(CAT_OUT, `${id}-400.webp`);
  if (!checkOnly) {
    await sharp(dest).resize(CAT_W / 2, Math.round(CAT_H / 2)).webp({ quality: 78, effort: 5 }).toFile(half);
    bytes += statSync(half).size;
  }
  count++;
}

// Anything in the drop folder that no product or family claims.
const claimed = new Set([...Object.values(MAP).flat(), ...Object.values(CATEGORY_MAP)]);
const orphans = [];
for (const dir of [SRC, CONSOLES]) {
  for (const f of readdirSync(dir)) {
    const fp = join(dir, f);
    if (statSync(fp).isFile() && !claimed.has(fp)) orphans.push(relative(resolve('.'), fp).replace(/\\/g, '/'));
  }
}

const size = checkOnly ? '' : ` (${(bytes / 1024 / 1024).toFixed(1)} MB)`;
console.log(`\n${count} images ${checkOnly ? 'checked' : 'written to public/media/{products,categories}'}${size}`);
if (orphans.length) {
  // `Tableaux 2 pack.jpeg` apparaît ici sans être inutilisée : c'est la photo
  // du bandeau de l'accueil, que prepare-signature.mjs taille en 4:3.
  console.log(`\n${orphans.length} source file(s) not used by any product or family:`);
  for (const o of orphans) console.log('  . ' + o);
}
console.log('');
