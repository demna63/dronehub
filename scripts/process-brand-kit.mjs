import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const BRAND_KIT_DIR = '/Users/usser/Downloads/DroneHub-Georgia-Brand-Kit';
const REPO_ROOT = '/Users/usser/Desktop/--main';
const BRAND_DIR = path.join(REPO_ROOT, 'public/brand');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

// Ensure directories exist
fs.mkdirSync(BRAND_DIR, { recursive: true });
fs.mkdirSync(path.join(BRAND_DIR, 'social'), { recursive: true });
fs.mkdirSync(path.join(BRAND_DIR, 'source'), { recursive: true });

console.log('1. Copying SVG files...');
const svgSrcDir = path.join(BRAND_KIT_DIR, 'svg');

// Copy SVGs to public/brand and public
const copyFile = (src, dest) => {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${path.basename(src)} -> ${path.relative(REPO_ROOT, dest)}`);
};

copyFile(path.join(svgSrcDir, 'icon-dark.svg'), path.join(BRAND_DIR, 'icon-dark.svg'));
copyFile(path.join(svgSrcDir, 'icon-dark.svg'), path.join(BRAND_DIR, 'icon.svg'));
copyFile(path.join(svgSrcDir, 'icon-dark.svg'), path.join(PUBLIC_DIR, 'icon.svg'));

copyFile(path.join(svgSrcDir, 'app-icon-rounded.svg'), path.join(BRAND_DIR, 'app-icon-rounded.svg'));

copyFile(path.join(svgSrcDir, 'lockup-dark.svg'), path.join(BRAND_DIR, 'lockup-dark.svg'));
copyFile(path.join(svgSrcDir, 'lockup-dark.svg'), path.join(BRAND_DIR, 'dronehub-lockup-dark.svg'));

copyFile(path.join(svgSrcDir, 'lockup-on-dark.svg'), path.join(BRAND_DIR, 'lockup-on-dark.svg'));
copyFile(path.join(svgSrcDir, 'lockup-on-dark.svg'), path.join(BRAND_DIR, 'lockup.svg'));
copyFile(path.join(svgSrcDir, 'lockup-on-dark.svg'), path.join(BRAND_DIR, 'dronehub-lockup.svg'));

// Create official PWA icon-maskable.svg
// Maskable icon requires all content to be inside a circle of diameter 80% (radius 204.8 at center 256, 256).
// The official icon D shape bbox: width 288 (118..406), height 340 (86..426). Center is approx (262, 256).
// Scaling by ~0.80 and translating so it centers at (256, 256) puts it safely within the safe zone.
const maskableSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Maskable: full-bleed background; mark sits safely inside 80% circle -->
  <rect width="512" height="512" fill="#06111F"/>
  <g transform="translate(46.4, 51.2) scale(0.8)">
    <path fill="#FFFFFF" d="M118 86h120c92 0 168 70 168 170s-76 170-168 170H118V86z"/>
    <path fill="#06111F" d="M236 150h28c58 0 104 44 104 106s-46 106-104 106h-28V150z"/>
    <polygon fill="#2EC4B6" points="214,196 214,316 318,256"/>
  </g>
</svg>
`;
fs.writeFileSync(path.join(BRAND_DIR, 'icon-maskable.svg'), maskableSvg);
console.log('Generated icon-maskable.svg');

// Create official PWA icon-monochrome.svg
const monochromeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <path fill="#FFFFFF" d="M118 86h120c92 0 168 70 168 170s-76 170-168 170H118V86z"/>
  <polygon fill="#FFFFFF" points="214,196 214,316 318,256"/>
</svg>
`;
fs.writeFileSync(path.join(BRAND_DIR, 'icon-monochrome.svg'), monochromeSvg);
console.log('Generated icon-monochrome.svg');

console.log('\n2. Copying website PNG assets...');
const webSrcDir = path.join(BRAND_KIT_DIR, 'website');
const webFiles = fs.readdirSync(webSrcDir).filter(f => f.endsWith('.png'));

for (const file of webFiles) {
  copyFile(path.join(webSrcDir, file), path.join(BRAND_DIR, file));
}

// Ensure aliases for compatibility
copyFile(path.join(webSrcDir, 'favicon-32.png'), path.join(BRAND_DIR, 'favicon-32x32.png'));
copyFile(path.join(webSrcDir, 'favicon-32.png'), path.join(PUBLIC_DIR, 'favicon-32x32.png'));
copyFile(path.join(webSrcDir, 'favicon-16.png'), path.join(PUBLIC_DIR, 'favicon-16x16.png'));
copyFile(path.join(webSrcDir, 'favicon-180.png'), path.join(BRAND_DIR, 'icon-180.png'));
copyFile(path.join(webSrcDir, 'favicon-180.png'), path.join(PUBLIC_DIR, 'icon-180.png'));
copyFile(path.join(webSrcDir, 'favicon-180.png'), path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
copyFile(path.join(webSrcDir, 'favicon-192.png'), path.join(BRAND_DIR, 'icon-192.png'));
copyFile(path.join(webSrcDir, 'favicon-192.png'), path.join(PUBLIC_DIR, 'icon-192.png'));
copyFile(path.join(webSrcDir, 'favicon-512.png'), path.join(BRAND_DIR, 'icon-512.png'));
copyFile(path.join(webSrcDir, 'favicon-512.png'), path.join(PUBLIC_DIR, 'icon-512.png'));
copyFile(path.join(webSrcDir, 'app-icon-512.png'), path.join(BRAND_DIR, 'icon-maskable-512.png'));

// Header & Logo aliases
copyFile(path.join(webSrcDir, 'header-dark-800x200.png'), path.join(BRAND_DIR, 'dhg-logo.png'));
copyFile(path.join(webSrcDir, 'header-dark-800x200.png'), path.join(PUBLIC_DIR, 'logo.png'));
copyFile(path.join(webSrcDir, 'header-dark-800x200.png'), path.join(PUBLIC_DIR, 'logo-dhg.png'));

// OpenGraph aliases
copyFile(path.join(webSrcDir, 'og-image-1200x630.png'), path.join(BRAND_DIR, 'og-image.png'));
copyFile(path.join(webSrcDir, 'og-image-1200x630.png'), path.join(PUBLIC_DIR, 'og-image.png'));
copyFile(path.join(webSrcDir, 'og-image-1200x630.png'), path.join(PUBLIC_DIR, 'og-image-1200x630.png'));

console.log('\n3. Generating multi-resolution favicon.ico...');
const icoSizes = [16, 32, 48];
const icoImages = icoSizes.map(size => {
  const buf = fs.readFileSync(path.join(webSrcDir, `favicon-${size}.png`));
  return { size, buf };
});

const headerLen = 6;
const dirEntryLen = 16;
let offset = headerLen + dirEntryLen * icoImages.length;

const entries = [];
for (const img of icoImages) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // width
  entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // height
  entry.writeUInt8(0, 2); // color palette count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(img.buf.length, 8); // size
  entry.writeUInt32LE(offset, 12); // offset
  entries.push(entry);
  offset += img.buf.length;
}

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2); // 1 = ICO
header.writeUInt16LE(icoImages.length, 4);

const multiIcoBuf = Buffer.concat([header, ...entries, ...icoImages.map(i => i.buf)]);
fs.writeFileSync(path.join(BRAND_DIR, 'favicon.ico'), multiIcoBuf);
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), multiIcoBuf);
console.log(`Generated favicon.ico (16/32/48) at public/brand/favicon.ico and public/favicon.ico (${multiIcoBuf.length} bytes)`);

console.log('\n4. Copying social and source assets for completeness...');
const socialSrcDir = path.join(BRAND_KIT_DIR, 'social');
for (const file of fs.readdirSync(socialSrcDir)) {
  copyFile(path.join(socialSrcDir, file), path.join(BRAND_DIR, 'social', file));
}

const sourceSrcDir = path.join(BRAND_KIT_DIR, 'source');
for (const file of fs.readdirSync(sourceSrcDir)) {
  copyFile(path.join(sourceSrcDir, file), path.join(BRAND_DIR, 'source', file));
}

console.log('\n5. Generating WebP and AVIF formats...');
const cwebpPath = '/opt/homebrew/bin/cwebp';

const convertToWebp = (pngPath, webpPath, quality = 90) => {
  try {
    execFileSync(cwebpPath, ['-q', String(quality), pngPath, '-o', webpPath], { stdio: 'pipe' });
    console.log(`Created WebP: ${path.relative(REPO_ROOT, webpPath)}`);
  } catch (err) {
    console.error(`Failed WebP conversion for ${pngPath}:`, err.message);
  }
};

const convertToAvif = (pngPath, avifPath) => {
  try {
    execFileSync('sips', ['-s', 'format', 'avif', pngPath, '--out', avifPath], { stdio: 'pipe' });
    console.log(`Created AVIF: ${path.relative(REPO_ROOT, avifPath)}`);
  } catch (err) {
    console.error(`Failed AVIF conversion for ${pngPath}:`, err.message);
  }
};

// Convert critical website assets to WebP and AVIF
const conversions = [
  {
    src: path.join(webSrcDir, 'og-image-1200x630.png'),
    webp: [path.join(BRAND_DIR, 'og-image.webp'), path.join(PUBLIC_DIR, 'og-image.webp')],
    avif: [path.join(BRAND_DIR, 'og-image.avif'), path.join(PUBLIC_DIR, 'og-image.avif')]
  },
  {
    src: path.join(webSrcDir, 'header-dark-800x200.png'),
    webp: [path.join(BRAND_DIR, 'dhg-logo.webp'), path.join(PUBLIC_DIR, 'logo.webp'), path.join(BRAND_DIR, 'header-dark-800x200.webp')],
    avif: [path.join(BRAND_DIR, 'dhg-logo.avif'), path.join(PUBLIC_DIR, 'logo.avif'), path.join(BRAND_DIR, 'header-dark-800x200.avif')]
  },
  {
    src: path.join(webSrcDir, 'header-dark-1200x280.png'),
    webp: [path.join(BRAND_DIR, 'header-dark-1200x280.webp')],
    avif: [path.join(BRAND_DIR, 'header-dark-1200x280.avif')]
  },
  {
    src: path.join(webSrcDir, 'header-dark-1600x360.png'),
    webp: [path.join(BRAND_DIR, 'header-dark-1600x360.webp')],
    avif: []
  },
  {
    src: path.join(webSrcDir, 'header-dark-2000x400.png'),
    webp: [path.join(BRAND_DIR, 'header-dark-2000x400.webp')],
    avif: []
  },
  {
    src: path.join(webSrcDir, 'stacked-dark-800.png'),
    webp: [path.join(BRAND_DIR, 'stacked-dark-800.webp')],
    avif: []
  },
  {
    src: path.join(webSrcDir, 'stacked-dark-1200.png'),
    webp: [path.join(BRAND_DIR, 'stacked-dark-1200.webp')],
    avif: []
  },
  {
    src: path.join(webSrcDir, 'favicon-192.png'),
    webp: [path.join(BRAND_DIR, 'icon-192.webp')],
    avif: []
  },
  {
    src: path.join(webSrcDir, 'favicon-512.png'),
    webp: [path.join(BRAND_DIR, 'icon-512.webp')],
    avif: []
  },
  {
    src: path.join(webSrcDir, 'app-icon-512.png'),
    webp: [path.join(BRAND_DIR, 'app-icon-512.webp')],
    avif: [path.join(BRAND_DIR, 'app-icon-512.avif')]
  }
];

for (const item of conversions) {
  for (const w of item.webp) {
    convertToWebp(item.src, w);
  }
  for (const a of item.avif) {
    convertToAvif(item.src, a);
  }
}

console.log('\n6. Generating transparent header lockup...');
import('zlib').then(zlib => {
  function decodePng(buf) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    let pos = 8;
    const idats = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString('ascii', pos + 4, pos + 8);
      if (type === 'IDAT') idats.push(buf.subarray(pos + 8, pos + 8 + len));
      pos += 12 + len;
    }
    const raw = zlib.inflateSync(Buffer.concat(idats));
    const bpp = 3;
    const stride = width * bpp;
    const out = Buffer.alloc(width * height * 3);
    let rawPos = 0;
    let prevRow = Buffer.alloc(stride);

    for (let y = 0; y < height; y++) {
      const filter = raw[rawPos++];
      const row = Buffer.alloc(stride);
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? row[i - bpp] : 0;
        const b = prevRow[i];
        const c = i >= bpp ? prevRow[i - bpp] : 0;
        const val = raw[rawPos++];
        if (filter === 0) row[i] = val;
        else if (filter === 1) row[i] = (val + a) & 0xff;
        else if (filter === 2) row[i] = (val + b) & 0xff;
        else if (filter === 3) row[i] = (val + Math.floor((a + b) / 2)) & 0xff;
        else if (filter === 4) {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
          row[i] = (val + pr) & 0xff;
        }
      }
      row.copy(out, y * stride);
      prevRow = row;
    }
    return { width, height, pixels: out };
  }

  function encodePngRgba(width, height, rgba) {
    const stride = 1 + width * 4;
    const raw = Buffer.alloc(height * stride);
    for (let y = 0; y < height; y++) {
      raw[y * stride] = 0;
      rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
    }
    const idatData = zlib.deflateSync(raw);

    function makeChunk(type, data) {
      const len = data.length;
      const buf = Buffer.alloc(12 + len);
      buf.writeUInt32BE(len, 0);
      buf.write(type, 4, 4, 'ascii');
      data.copy(buf, 8);
      const crc = crc32(buf.subarray(4, 8 + len));
      buf.writeInt32BE(crc, 8 + len);
      return buf;
    }

    function crc32(buf) {
      let c = 0xffffffff;
      for (let i = 0; i < buf.length; i++) {
        c ^= buf[i];
        for (let k = 0; k < 8; k++) {
          c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
        }
      }
      return (c ^ 0xffffffff) | 0;
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      makeChunk('IHDR', ihdr),
      makeChunk('IDAT', idatData),
      makeChunk('IEND', Buffer.alloc(0))
    ]);
  }

  const p = decodePng(fs.readFileSync(path.join(webSrcDir, 'header-dark-2000x400.png')));
  const bgR = p.pixels[0], bgG = p.pixels[1], bgB = p.pixels[2];
  let minX = p.width, maxX = 0, minY = p.height, maxY = 0;
  for (let y = 0; y < p.height; y++) {
    for (let x = 0; x < p.width; x++) {
      const idx = (y * p.width + x) * 3;
      const r = p.pixels[idx], g = p.pixels[idx+1], b = p.pixels[idx+2];
      if (r > 30 || g > 40 || b > 60) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 8;
  minX = Math.max(0, minX - pad);
  maxX = Math.min(p.width - 1, maxX + pad);
  minY = Math.max(0, minY - pad);
  maxY = Math.min(p.height - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const rgba = Buffer.alloc(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * p.width + (minX + x)) * 3;
      const dstIdx = (y * cropW + x) * 4;
      const r = p.pixels[srcIdx], g = p.pixels[srcIdx + 1], b = p.pixels[srcIdx + 2];
      const dr = Math.max(0, r - bgR), dg = Math.max(0, g - bgG), db = Math.max(0, b - bgB);
      let alpha = Math.min(255, Math.round(Math.max(dr, dg, db) * 1.06));
      if (alpha < 10) alpha = 0;

      if (alpha === 0) {
        rgba[dstIdx] = 0; rgba[dstIdx + 1] = 0; rgba[dstIdx + 2] = 0; rgba[dstIdx + 3] = 0;
      } else {
        const aNorm = alpha / 255;
        rgba[dstIdx] = Math.min(255, Math.max(0, Math.round((r - bgR * (1 - aNorm)) / aNorm)));
        rgba[dstIdx + 1] = Math.min(255, Math.max(0, Math.round((g - bgG * (1 - aNorm)) / aNorm)));
        rgba[dstIdx + 2] = Math.min(255, Math.max(0, Math.round((b - bgB * (1 - aNorm)) / aNorm)));
        rgba[dstIdx + 3] = alpha;
      }
    }
  }

  const lockupPng = encodePngRgba(cropW, cropH, rgba);
  const outPng = path.join(BRAND_DIR, 'dronehub-lockup.png');
  fs.writeFileSync(outPng, lockupPng);
  convertToWebp(outPng, path.join(BRAND_DIR, 'dronehub-lockup.webp'), 95);
  convertToAvif(outPng, path.join(BRAND_DIR, 'dronehub-lockup.avif'));
  console.log('\nAll brand assets processed successfully!');
});
