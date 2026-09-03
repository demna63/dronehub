#!/usr/bin/env node
// Firebase Auth users export via the Identity Toolkit REST API.
//
// Works around `firebase auth:export` returning HTTP 403 under user
// Application Default Credentials that lack an associated quota project.
// Sends the gcloud OAuth access token together with an explicit
// `X-Goog-User-Project` header, and paginates through `nextPageToken`
// so the export scales past a single 1000-account page.
//
// Usage: PROJECT=<id> node scripts/backup-auth.mjs <projectId> <outFile>
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PROJECT = process.env.PROJECT || process.argv[2];
const OUT = process.argv[3] || `${process.env.HOME}/Desktop/auth-users.json`;
const PAGE_SIZE = 1000;
const ENDPOINT =
  'https://www.googleapis.com/identitytoolkit/v3/relyingparty/downloadAccount';

if (!PROJECT) {
  console.error('backup-auth: PROJECT id missing (env PROJECT or argv[2]).');
  process.exit(1);
}

/** Fetch a short-lived OAuth access token from the local gcloud session. */
const getAccessToken = () =>
  execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();

/** Fetch one page of accounts; throws on any non-2xx response. */
const fetchPage = async (accessToken, nextPageToken) => {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Goog-User-Project': PROJECT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      maxResults: PAGE_SIZE,
      ...(nextPageToken ? { nextPageToken } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
};

const main = async () => {
  const accessToken = getAccessToken();
  const users = [];
  let pageToken;
  do {
    const data = await fetchPage(accessToken, pageToken);
    if (Array.isArray(data.users)) users.push(...data.users);
    pageToken = data.nextPageToken;
  } while (pageToken);

  writeFileSync(OUT, JSON.stringify({ users }, null, 2));
  console.log(`  ✔ Auth users exported (${users.length}) → ${OUT}`);
};

main().catch((err) => {
  console.error(`  ⚠ REST auth export failed: ${err.message}`);
  process.exit(1);
});
