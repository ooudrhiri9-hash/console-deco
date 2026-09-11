/**
 * Product photos: src/products/**  ->  public/media/products/*.webp
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

const wa = (t) => join(CONSOLES, `WhatsApp Image 2026-09-01 at ${t}.jpeg`);
const wa4 = (t) => join(SRC, `WhatsApp Image 2026-09-04 at ${t}.jpeg`);

/** slug -> source files, in display order. The first one is the card thumbnail. */
const MAP = {
  'console-visages-polychromes': [wa('21.45.44')],
  'console-courbes-terre-et-sauge': [wa('21.45.44 (1)')],
  'console-visages-au-trait': [wa('21.45.44 (2)')],
  'console-visages-sepia': [wa('21.45.45'), wa('21.45.45 (1)')],
  'console-arcs-camel-et-noir': [wa('21.45.45 (4)'), wa('21.45.45 (2)'), wa('21.45.45 (5)')],
  'console-arcs-noir-et-blanc': [wa('21.45.45 (3)')],
  'console-couronne': [wa('21.45.45 (6)')],
  'console-feuillage-beige-et-noir': [wa('21.45.46'), wa('21.45.46 (3)')],
  'console-calligraphie': [wa('21.45.46 (1)')],
  'console-patine-terracotta': [wa('21.45.46 (4)'), wa('21.45.46 (2)'), wa('21.45.46 (5)')],
  'console-patine-or-et-noir': [wa('21.45.46 (6)')],
  'console-arcades-vert-et-terracotta': [wa('21.45.46 (7)')],
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
  'table-basse-damier': [join(SRC, 'Tables Basses.jpeg'), join(SRC, 'Tables Basses-1.jpeg')],
};

/** Client drawings and product sheets: they carry text, so never copy-extend. */
const SHEETS = new Set([
  wa4('01.39.35'),
  wa4('01.39.38'),
  wa4('01.44.33'),
  join(SRC, 'Tables Basses-1.jpeg'),
]);

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

async function convert(file, dest) {
  const meta = await sharp(file).metadata();
  const ratio = meta.width / meta.height;

  if (ratio <= MAX_CROP_RATIO) {
    if (!checkOnly) {
      await sharp(file)
        .resize(W, H, { fit: 'cover', position: 'centre' })
        .webp({ quality: 80, effort: 5 })
        .toFile(dest);
    }
    return `crop      ${ratio.toFixed(2)}`;
  }

  if (SHEETS.has(file)) {
    const background = await cornerColour(file);
    if (!checkOnly) {
      await sharp(file)
        .resize(W, H, { fit: 'contain', background })
        .webp({ quality: 80, effort: 5 })
        .toFile(dest);
    }
    return `letterbox ${ratio.toFixed(2)}`;
  }

  // Fit the full width, then grow back to 4:5 by copying the top row upwards.
  // Upwards only: the top of these frames is always plain wall, which copies
  // invisibly, whereas copying the bottom row smears the floor or the rug into
  // vertical streaks.
  const fitted = await sharp(file).resize({ width: W }).toBuffer();
  const fittedHeight = (await sharp(fitted).metadata()).height;
  const short = Math.max(0, H - fittedHeight);
  if (!checkOnly) {
    await sharp(fitted)
      .extend({ top: short, extendWith: 'copy' })
      .resize(W, H, { fit: 'cover' })
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
if (absent.length) {
  console.error('\n! Source photo(s) not found:\n' + absent.map((m) => '  x ' + m).join('\n') + '\n');
  process.exit(1);
}

if (!checkOnly) mkdirSync(OUT, { recursive: true });

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
  }
}

// Anything in the drop folder that no product claims.
const claimed = new Set(Object.values(MAP).flat());
const orphans = [];
for (const dir of [SRC, CONSOLES]) {
  for (const f of readdirSync(dir)) {
    const fp = join(dir, f);
    if (statSync(fp).isFile() && !claimed.has(fp)) orphans.push(relative(resolve('.'), fp).replace(/\\/g, '/'));
  }
}

const size = checkOnly ? '' : ` (${(bytes / 1024 / 1024).toFixed(1)} MB)`;
console.log(`\n${count} images ${checkOnly ? 'checked' : 'written to public/media/products'}${size}`);
if (orphans.length) {
  console.log(`\n${orphans.length} source file(s) not used by any product:`);
  for (const o of orphans) console.log('  . ' + o);
}
console.log('');
