import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateAppIconPng(width, height, isMaskable = false) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const safeRadius = isMaskable ? width * 0.40 : width * 0.47;

  // Simple bitmap pattern for "DB" monogram on an emerald app icon
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background
      let r = 6, g = 78, b = 59, a = 255; // #064e3b deep emerald

      // Subtle gradient highlight towards top-left
      const grad = Math.max(0, 1 - (Math.sqrt((x - width * 0.3) ** 2 + (y - height * 0.3) ** 2) / (width * 0.9)));
      r = Math.min(255, Math.floor(6 + grad * 30));
      g = Math.min(255, Math.floor(78 + grad * 50));
      b = Math.min(255, Math.floor(59 + grad * 40));

      if (!isMaskable) {
        // Rounded squircle for non-maskable / apple-touch
        const roundRadius = width * 0.22;
        const cornerDistX = Math.max(0, Math.abs(dx) - (cx - roundRadius));
        const cornerDistY = Math.max(0, Math.abs(dy) - (cy - roundRadius));
        const cornerDist = Math.sqrt(cornerDistX * cornerDistX + cornerDistY * cornerDistY);

        if (cornerDist > roundRadius) {
          a = 0; // Transparent outside rounded corner
        }
      }

      if (a > 0) {
        // Golden circular emblem ring
        const ringRad = isMaskable ? width * 0.36 : width * 0.40;
        const ringThick = width * 0.025;
        if (dist >= ringRad - ringThick && dist <= ringRad + ringThick) {
          r = 234; g = 179; b = 8; // Gold #eab308
        }

        // Draw Stylized 'D' and 'B' central shapes
        // Normalized coordinates in [-1, 1] relative to center
        const nx = dx / (width * 0.32);
        const ny = dy / (height * 0.32);

        // Letter D on left: [-0.85, -0.05]
        const inD_Stem = nx >= -0.85 && nx <= -0.65 && ny >= -0.65 && ny <= 0.65;
        const d_dist = Math.sqrt((nx - -0.65) ** 2 + ny ** 2);
        const inD_Loop = (nx >= -0.65) && (d_dist <= 0.65) && (d_dist >= 0.45);

        // Letter B on right: [0.05, 0.85]
        const inB_Stem = nx >= 0.05 && nx <= 0.25 && ny >= -0.65 && ny <= 0.65;
        const b1_dist = Math.sqrt((nx - 0.25) ** 2 + (ny - -0.32) ** 2);
        const inB_Loop1 = (nx >= 0.25) && (b1_dist <= 0.34) && (b1_dist >= 0.16);
        const b2_dist = Math.sqrt((nx - 0.25) ** 2 + (ny - 0.32) ** 2);
        const inB_Loop2 = (nx >= 0.25) && (b2_dist <= 0.36) && (b2_dist >= 0.18);

        // Small rupee/taka style coin mark or central dot
        const inCoin = (nx >= -0.15 && nx <= -0.05) && (ny >= -0.15 && ny <= 0.15);

        if (inD_Stem || inD_Loop || inB_Stem || inB_Loop1 || inB_Loop2 || inCoin) {
          r = 255; g = 255; b = 255; // White monogram
        }
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, makeChunk('IHDR', ihdr), idat, iend]);
}

fs.writeFileSync('public/pwa-192x192.png', generateAppIconPng(192, 192, false));
fs.writeFileSync('public/pwa-512x512.png', generateAppIconPng(512, 512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', generateAppIconPng(512, 512, true));
fs.writeFileSync('public/apple-touch-icon.png', generateAppIconPng(180, 180, false));
console.log('Successfully generated PWA icon set in public/');
