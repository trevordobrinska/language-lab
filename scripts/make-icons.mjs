// Draws the home-screen icons into public/icons/ (run: node scripts/make-icons.mjs).
// A dark ㅇ ring with a green dot on the app's cream background; no image library needed.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const CREAM = [0xf6, 0xf1, 0xe7];
const INK = [0x22, 0x22, 0x22];
const GREEN = [0x5c, 0xa8, 0x52];
const SAMPLES = 4; // supersampling per axis, for smooth edges

/** Colour at (x, y) in a unit square, before anti-aliasing. `inset` shrinks the art for maskable icons. */
function colourAt(x, y, inset) {
  const s = 1 - 2 * inset;
  const u = (x - inset) / s;
  const v = (y - inset) / s;
  const ring = Math.hypot(u - 0.5, v - 0.52);
  if (ring > 0.2 && ring < 0.32) return INK;
  if (Math.hypot(u - 0.5, v - 0.15) < 0.07) return GREEN;
  return CREAM;
}

function draw(size, inset) {
  const rows = [];
  for (let py = 0; py < size; py++) {
    const row = Buffer.alloc(1 + size * 3); // filter byte 0, then RGB
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SAMPLES; sy++)
        for (let sx = 0; sx < SAMPLES; sx++) {
          const c = colourAt((px + (sx + 0.5) / SAMPLES) / size, (py + (sy + 0.5) / SAMPLES) / size, inset);
          for (let i = 0; i < 3; i++) sum[i] += c[i];
        }
      for (let i = 0; i < 3; i++) row[1 + px * 3 + i] = Math.round(sum[i] / SAMPLES ** 2);
    }
    rows.push(row);
  }
  return png(size, Buffer.concat(rows));
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(size, raw) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const dir = new URL("../public/icons/", import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL("icon-192.png", dir), draw(192, 0));
writeFileSync(new URL("icon-512.png", dir), draw(512, 0));
writeFileSync(new URL("icon-maskable-512.png", dir), draw(512, 0.1));
writeFileSync(new URL("apple-touch-icon.png", dir), draw(180, 0));
