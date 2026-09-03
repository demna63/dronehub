#!/usr/bin/env node
/**
 * Firebase Storage backup for dronehubgeorgia-a7bd5
 *
 * Usage:
 *   node scripts/backup-storage.mjs
 *   node scripts/backup-storage.mjs --out ~/Desktop/dronehub-backup-2026-07-02
 *
 * Option A (preferred after unsuspension): gsutil
 *   gsutil -m cp -r gs://dronehubgeorgia-a7bd5.firebasestorage.app/* ./backup-storage/
 *
 * Option B: this script lists + downloads public paths via client SDK
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { initializeApp } from 'firebase/app';
import { getStorage, listAll, ref, getDownloadURL } from 'firebase/storage';

async function loadDotEnv() {
  if (process.env.VITE_FIREBASE_PROJECT_ID) return;
  try {
    const raw = await readFile('.env', 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* .env optional */
  }
}

await loadDotEnv();

const BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'dronehub-ge-1a1a6.firebasestorage.app';
const outArg = process.argv.indexOf('--out');
const OUT_DIR =
  outArg !== -1 ? process.argv[outArg + 1] : join(process.env.HOME, 'Desktop', 'dronehub-backup-2026-07-02', 'storage');

const PUBLIC_PREFIXES = ['posts', 'market', 'avatars', 'builds', 'stl_images', 'stl_files'];

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function downloadUrl(url, dest) {
  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function listPrefix(storage, prefix) {
  const root = ref(storage, prefix);
  const listing = await listAll(root);
  const files = [...listing.items];
  for (const sub of listing.prefixes) {
    const subListing = await listAll(sub);
    files.push(...subListing.items);
  }
  return files;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Storage backup → ${OUT_DIR}`);
  console.log(`Bucket: ${BUCKET}\n`);

  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const manifest = [];

  for (const prefix of PUBLIC_PREFIXES) {
    process.stdout.write(`  ${prefix}/… `);
    let items = [];
    try {
      items = await listPrefix(storage, prefix);
    } catch (err) {
      console.log(`skip (${err.code || err.message})`);
      continue;
    }

    let ok = 0;
    for (const item of items) {
      const rel = item.fullPath;
      const dest = join(OUT_DIR, rel);
      try {
        const url = await getDownloadURL(item);
        await downloadUrl(url, dest);
        manifest.push({ path: rel, local: dest, ok: true });
        ok++;
      } catch (err) {
        manifest.push({ path: rel, ok: false, error: err.message });
      }
    }
    console.log(`${ok}/${items.length} files`);
  }

  const manifestPath = join(OUT_DIR, '..', 'storage-manifest.json');
  await writeFile(manifestPath, JSON.stringify({ exportedAt: new Date().toISOString(), bucket: BUCKET, manifest }, null, 2));
  console.log(`\n✔ Manifest: ${manifestPath}`);
}

main().catch((err) => {
  if (String(err.message).includes('suspended') || String(err.code).includes('storage/unauthorized')) {
    console.error('\n✖ Storage API blocked (project suspended or permissions).');
    console.error('  After unsuspension, prefer:');
    console.error(`  gsutil -m cp -r gs://${BUCKET} ~/Desktop/dronehub-backup-2026-07-02/storage/`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
