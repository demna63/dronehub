#!/usr/bin/env node
/**
 * Firestore backup for dronehubgeorgia-a7bd5
 *
 * Usage:
 *   node --env-file=.env scripts/backup-firestore.mjs
 *   node --env-file=.env scripts/backup-firestore.mjs --out ~/Desktop/dronehub-backup-2026-07-02
 *
 * Requires: project unsuspended OR Firebase Console service-account key at
 *   ./firebase-service-account.json (gitignored)
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import {
  collection,
  getDocs,
  getFirestore,
} from 'firebase/firestore';

async function loadDotEnv() {
  if (process.env.VITE_FIREBASE_PROJECT_ID) return;
  try {
    const raw = await readFile('.env', 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* .env optional if env vars already set */
  }
}

await loadDotEnv();

// Live project by default. To back up the OLD (suspended) project after it is
// reinstated, run with: VITE_FIREBASE_PROJECT_ID=dronehubgeorgia-a7bd5 npm run backup
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'dronehub-ge-1a1a6';
const outArg = process.argv.indexOf('--out');
const OUT_DIR =
  outArg !== -1 ? process.argv[outArg + 1] : join(process.env.HOME, 'Desktop', 'dronehub-backup-2026-07-02');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

/** Collections with allow read: if true in firestore.rules */
const PUBLIC_COLLECTIONS = [
  'posts',
  'categories',
  'vlogs',
  'droneBuilds',
  'spots',
  'stlFiles',
  'presets',
  'meetRooms',
];

/** Subcollections to pull under each parent doc */
const SUBCOLLECTIONS = {
  posts: ['comments', 'votes'],
};

const serialize = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  }
  return value;
};

async function exportCollection(db, name) {
  const snap = await getDocs(collection(db, name));
  if (snap.metadata.fromCache && snap.empty) {
    throw new Error('CONSUMER_SUSPENDED');
  }
  const docs = [];
  for (const docSnap of snap.docs) {
    const row = { id: docSnap.id, ...serialize(docSnap.data()) };
    const subs = SUBCOLLECTIONS[name] || [];
    for (const sub of subs) {
      const subSnap = await getDocs(collection(db, name, docSnap.id, sub));
      row[`_${sub}`] = subSnap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) }));
    }
    docs.push(row);
  }
  return docs;
}

async function tryAdminExport() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json';
  if (!existsSync(keyPath)) return null;

  const admin = await import('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(keyPath),
      projectId: PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    });
  }
  const db = admin.firestore();
  const allCollections = [
    ...PUBLIC_COLLECTIONS,
    'users',
    'global_messages',
    'notifications',
    'chatRooms',
    'channels',
    'system_diagnostics',
  ];

  const result = {};
  for (const name of allCollections) {
    process.stdout.write(`  [admin] ${name}… `);
    const snap = await db.collection(name).get();
    result[name] = snap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) }));
    console.log(`${result[name].length} docs`);
  }
  return result;
}

async function clientExport(db) {
  const result = {};
  for (const name of PUBLIC_COLLECTIONS) {
    process.stdout.write(`  [client] ${name}… `);
    result[name] = await exportCollection(db, name);
    console.log(`${result[name].length} docs`);
  }
  return result;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Backup → ${OUT_DIR}`);
  console.log(`Project: ${PROJECT_ID}\n`);

  let data = null;
  let mode = 'client';

  try {
    data = await tryAdminExport();
    if (data) mode = 'admin';
  } catch (err) {
    console.warn('Admin export unavailable:', err.message);
  }

  if (!data) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    data = await clientExport(db);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const total = Object.values(data).reduce((n, rows) => n + rows.length, 0);
  if (mode === 'client' && total === 0) {
    throw new Error('CONSUMER_SUSPENDED: all collections returned 0 documents');
  }
  const outFile = join(OUT_DIR, `firestore-${mode}-${stamp}.json`);
  await writeFile(outFile, JSON.stringify({ exportedAt: new Date().toISOString(), projectId: PROJECT_ID, mode, data }, null, 2));
  console.log(`\n✔ Firestore backup: ${outFile}`);

  const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]));
  await writeFile(join(OUT_DIR, 'firestore-summary.json'), JSON.stringify(counts, null, 2));
}

main().catch((err) => {
  const msg = String(err.message || err.code || err);
  if (msg.includes('CONSUMER_SUSPENDED') || msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
    console.error('\n✖ Project is still suspended — Firestore API is blocked.');
    console.error('  Your data is NOT deleted, but export must wait until Google unsuspends the project.');
    console.error('  Add data-preservation language to your appeal (see docs/security-incident-2026-07.md).');
    console.error('  Re-run after unsuspension: npm run backup');
  } else {
    console.error(err);
  }
  process.exit(1);
});
