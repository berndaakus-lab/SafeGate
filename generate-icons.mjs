// Minimal PNG generator — no dependencies
// Run: node generate-icons.mjs
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

function createPNG(size) {
  // Draw pixels: blue background, white shield
  const pixels = new Uint8Array(size * size * 4);

  const bg = [29, 78, 216, 255];   // #1d4ed8 blue
  const white = [255, 255, 255, 255];
  const cx = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // Rounded rect background (radius = 18%)
      const r = size * 0.18;
      const inBg =
        x >= r && x <= size - r
          ? true
          : y >= r && y <= size - r
          ? true
          : Math.hypot(Math.min(x, size - 1 - x) - r, Math.min(y, size - 1 - y) - r) <= r;

      // Shield: pentagon-ish shape
      const sy = size * 0.18, sh = size * 0.62, sw = size * 0.26;
      const relY = y - sy;
      const halfW = relY < sh * 0.3 ? sw : sw * (1 - (relY - sh * 0.3) / (sh * 0.7));
      const inShield =
        relY >= 0 && relY <= sh &&
        Math.abs(x - cx) <= halfW &&
        (relY < sh * 0.85 || Math.abs(x - cx) <= sw * (1 - (relY - sh * 0.85) / (sh * 0.15)));

      // Checkmark pixels
      const ckY1 = sy + sh * 0.55, ckY2 = sy + sh * 0.7, ckY3 = sy + sh * 0.38;
      const ck1x = cx - sw * 0.18, ck2x = cx - sw * 0.02, ck3x = cx + sw * 0.22;
      const lw = size * 0.035;
      function distToSeg(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(px - ax - t * dx, py - ay - t * dy);
      }
      const onCheck =
        distToSeg(x, y, ck1x, ckY1, ck2x, ckY2) < lw ||
        distToSeg(x, y, ck2x, ckY2, ck3x, ckY3) < lw;

      let color = [0, 0, 0, 0];
      if (inBg) color = bg;
      if (inShield) color = white;
      if (inShield && onCheck) color = bg;

      pixels[i] = color[0];
      pixels[i + 1] = color[1];
      pixels[i + 2] = color[2];
      pixels[i + 3] = color[3];
    }
  }

  return encodePNG(size, size, pixels);
}

function encodePNG(w, h, rgba) {
  // Raw image data: filter byte 0 + RGBA per row
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter none
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4;
      const dst = y * (1 + w * 4) + 1 + x * 4;
      raw[dst] = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
      raw[dst + 3] = rgba[src + 3];
    }
  }
  const compressed = deflateSync(raw, { level: 6 });

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crc = crc32(Buffer.concat([typeB, data]));
    const crcB = Buffer.alloc(4); crcB.writeInt32BE(crc);
    return Buffer.concat([len, typeB, data, crcB]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// CRC32
const crcTable = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

writeFileSync("public/icon-192.png", createPNG(192));
writeFileSync("public/icon-512.png", createPNG(512));
console.log("Done: public/icon-192.png and public/icon-512.png");
