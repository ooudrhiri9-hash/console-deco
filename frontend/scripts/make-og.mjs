/**
 * Generates a placeholder public/og-default.png (1200x630) used by Open Graph
 * and WhatsApp link previews.
 * TODO(client): replace with a real photograph of a flagship piece + the logo.
 * Run: node scripts/make-og.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const W = 1200, H = 630;
const BONE = [0xff, 0xff, 0xff];
const INK = [0x14, 0x12, 0x0f];
const BRASS = [0xa6, 0x7c, 0x34];

const px = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  const row = y * (1 + W * 3);
  px[row] = 0; // filter: none
  for (let x = 0; x < W; x++) {
    // Bone ground, an ink band along the bottom, a brass hairline frame.
    let c = BONE;
    if (y > H - 96) c = INK;
    const onFrame =
      (x === 48 || x === W - 49 || y === 48 || y === H - 49) &&
      x >= 48 && x <= W - 49 && y >= 48 && y <= H - 49;
    if (onFrame) c = BRASS;
    const i = row + 1 + x * 3;
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 2;  // truecolour
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(px, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync('public/og-default.png', png);
console.log('public/og-default.png', png.length, 'bytes');
