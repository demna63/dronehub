#!/usr/bin/env node
/**
 * Backfills `imageWidth` / `imageHeight` on existing `posts` documents.
 *
 * New posts store their intrinsic image size at upload time (see
 * services/storageService.ts). Documents written before that shipped have no
 * dimensions, so the feed falls back to a 16:10 placeholder ratio. Running this
 * once gives every legacy post its exact ratio and takes CLS to zero.
 *
 * Dimensions are parsed straight from each image's header bytes over a ranged
 * GET (WebP / PNG / JPEG) — no image decoding, no native dependency, ~a few KB
 * of transfer per post instead of the full file.
 *
 * Usage:
 *   node scripts/backfill-image-dimensions.mjs --dry-run
 *   node scripts/backfill-image-dimensions.mjs
 *   node scripts/backfill-image-dimensions.mjs --force   # also re-check posts that already have dims
 *
 * Requires a service-account key at ./firebase-service-account.json (gitignored)
 * and firebase-admin, which ships with ./functions:
 *   node --experimental-default-type=module scripts/backfill-image-dimensions.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const KEY_PATH = './firebase-service-account.json';
const HEADER_BYTES = 32 * 1024;
const CONCURRENCY = 8;

/* ------------------------------------------------------------------ *
 * Header parsers — each returns { width, height } or null.
 * ------------------------------------------------------------------ */

/** PNG: IHDR is always the first chunk; width/height are big-endian at 16/20. */
function parsePng(b) {
  if (b.length < 24) return null;
  if (b.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/** WebP: three container flavours, each with its own size encoding. */
function parseWebp(b) {
  if (b.length < 30) return null;
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;

  const fourCC = b.toString('ascii', 12, 16);

  if (fourCC === 'VP8X') {
    return {
      width: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
      height: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
    };
  }

  if (fourCC === 'VP8 ') {
    // Lossy keyframe: 3-byte frame tag, then the 0x9d012a start code.
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    return {
      width: b.readUInt16LE(26) & 0x3fff,
      height: b.readUInt16LE(28) & 0x3fff,
    };
  }

  if (fourCC === 'VP8L') {
    if (b[20] !== 0x2f) return null;
    const bits = b.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

/** JPEG: walk the marker chain to the first SOF segment. */
function parseJpeg(b) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const marker = b[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const length = b.readUInt16BE(i + 2);
    const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSOF) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  return null;
}

const readDimensions = (buffer) => parseWebp(buffer) || parsePng(buffer) || parseJpeg(buffer);

/** Fetches only the leading bytes of an image and parses its intrinsic size. */
async function probeUrl(url) {
  const res = await fetch(url, { headers: { Range: `bytes=0-${HEADER_BYTES - 1}` } });
  if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
  return readDimensions(Buffer.from(await res.arrayBuffer()));
}

/** Runs `worker` over `items` with a bounded number of in-flight requests. */
async function mapLimit(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

/* ------------------------------------------------------------------ */

if (!existsSync(KEY_PATH)) {
  console.error(`Missing ${KEY_PATH} — download a service-account key from the Firebase console first.`);
  process.exit(1);
}

let admin;
try {
  admin = require('firebase-admin');
} catch {
  admin = require('./../functions/node_modules/firebase-admin');
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
const db = admin.firestore();

const snapshot = await db.collection('posts').get();
const targets = snapshot.docs.filter((doc) => {
  const data = doc.data();
  if (!data.image) return false;
  return FORCE || !(data.imageWidth > 0 && data.imageHeight > 0);
});

console.log(`posts: ${snapshot.size} · missing dimensions: ${targets.length}${DRY_RUN ? ' · DRY RUN' : ''}`);

const probed = await mapLimit(targets, CONCURRENCY, async (doc) => {
  try {
    const dims = await probeUrl(doc.data().image);
    if (!dims || !(dims.width > 0) || !(dims.height > 0)) {
      console.warn(`  ? ${doc.id} — unrecognised image header, skipped`);
      return null;
    }
    console.log(`  ✓ ${doc.id} — ${dims.width}×${dims.height}`);
    return { id: doc.id, ...dims };
  } catch (error) {
    console.warn(`  ✗ ${doc.id} — ${error.message}`);
    return null;
  }
});

const updates = probed.filter(Boolean);

if (DRY_RUN) {
  console.log(`would update ${updates.length} document(s)`);
  process.exit(0);
}

// Firestore caps a batch at 500 writes.
for (let offset = 0; offset < updates.length; offset += 500) {
  const batch = db.batch();
  for (const { id, width, height } of updates.slice(offset, offset + 500)) {
    batch.update(db.collection('posts').doc(id), { imageWidth: width, imageHeight: height });
  }
  await batch.commit();
}

console.log(`updated ${updates.length} document(s)`);
process.exit(0);
