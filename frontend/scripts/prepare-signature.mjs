/**
 * The photo of the "console + tableau" band on the home page.
 *
 *   src/products/Tableaux 2 pack.jpeg  ->  public/media/signature/signature-*.webp
 *
 *   node scripts/prepare-signature.mjs            (write)
 *   node scripts/prepare-signature.mjs --check    (report only)
 *
 * Kept out of prepare-media.mjs on purpose: that script bakes every product
 * photo to the 4:5 well of the catalogue grid, while this one is a single
 * editorial image in the 4:3 of the band. Same principle though — the raw file
 * that became the published asset is recorded here rather than in someone's
 * memory, so the image can be regenerated or swapped without guesswork.
 *
 * The source is nearly square (1071x1077) and the band is 4:3, so the centre
 * crop drops the ceiling and the coffee table. The two framed pieces and the
 * console below them — the whole point of the section — sit in the middle band
 * that survives. Widths stop at 1040 because the source is 1071 wide: an
 * upscale would only add weight, never detail.
 */
import { mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const SRC = resolve('src/products/Tableaux 2 pack.jpeg');
const OUT = resolve('public/media/signature');

/** Half the 1280 px container on desktop, so ~560 CSS px — 1040 covers 2x. */
const WIDTHS = [560, 800, 1040];
const RATIO = 4 / 3;

const checkOnly = process.argv.includes('--check');
if (!checkOnly) mkdirSync(OUT, { recursive: true });

const meta = await sharp(SRC).metadata();
console.log(`  source ${meta.width}x${meta.height}`);

let bytes = 0;
for (const width of WIDTHS) {
  const height = Math.round(width / RATIO);
  const name = `signature-${width}.webp`;
  const dest = join(OUT, name);
  if (!checkOnly) {
    await sharp(SRC)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80, effort: 5 })
      .toFile(dest);
    bytes += statSync(dest).size;
  }
  console.log(`  ${name.padEnd(24)} ${width}x${height}`);
}

const size = checkOnly ? '' : ` (${Math.round(bytes / 1024)} kB)`;
console.log(`\n${WIDTHS.length} images ${checkOnly ? 'checked' : 'written to public/media/signature'}${size}\n`);
