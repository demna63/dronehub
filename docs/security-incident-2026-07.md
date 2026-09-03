# Security Incident — dronehubgeorgia-a7bd5 (July 2026)

## Summary

Google suspended GCP project `dronehubgeorgia-a7bd5` after a **Gemini API key** was shipped in the public
production JavaScript bundle on `https://dronehub.ge`. A third party harvested the key and used it for
abusive activity.

**Root cause:** `DiagnosticPage.tsx` used dynamic `import.meta.env[key]` lookups. Vite inlined the **entire**
`import.meta.env` object into `dist/`, including `VITE_GEMINI_API_KEY`.

**Fixed in:** commit `ed35666` (2026-07-02) + follow-up hardening in `src/lib/firebase/config.ts`.

**Exposure window:** ~2026-06-23 → 2026-07-02 (~9 days).

---

## Immediate actions (do in order)

### 1. Revoke compromised Gemini API key

1. Open [Google AI Studio → API Keys](https://aistudio.google.com/apikey)
2. **Delete** every key that existed before 2026-07-02
3. Create a **new** key — store it only in Firebase Functions secrets (never in `.env` for production builds)

### 2. Rotate Firebase Functions secret

```bash
# After project unsuspension:
cd /path/to/dronehub
firebase functions:secrets:set GEMINI_API_KEY --project dronehubgeorgia-a7bd5
# paste new key when prompted

firebase deploy --only functions --project dronehubgeorgia-a7bd5
```

### 3. Review GCP API keys (Console)

Suspended projects block CLI — use the web console:

- https://console.cloud.google.com/apis/credentials?project=dronehubgeorgia-a7bd5
- Delete or restrict every Browser / API key you do not recognise
- Firebase web `apiKey` is public by design — restrict it to your domains in Firebase Console → Project settings

### 4. Audit resources

After unsuspension, check and delete anything you did not create:

| Resource | Console link |
|----------|-------------|
| Cloud Run | https://console.cloud.google.com/run?project=dronehubgeorgia-a7bd5 |
| Compute Engine | https://console.cloud.google.com/compute/instances?project=dronehubgeorgia-a7bd5 |
| Cloud Functions | https://console.cloud.google.com/functions/list?project=dronehubgeorgia-a7bd5 |
| Billing | https://console.cloud.google.com/billing |

Known legitimate resource: `dronehub-georgia-social-media-agent` (Google AI Studio, label `managed-by: google-ai-studio`).

### 5. Backup Firestore & Storage (after unsuspension)

Suspension blocks all export APIs. **Data is not deleted**, but backup must wait until Google restores the project.

```bash
# One command (recommended):
npm run backup:all

# Or step by step:
node scripts/backup-firestore.mjs
node scripts/backup-storage.mjs
```

Backup folder: `~/Desktop/dronehub-backup-2026-07-02/`

**Optional — full admin export:** download service account JSON from
[Firebase Console → Project settings → Service accounts](https://console.firebase.google.com/project/dronehubgeorgia-a7bd5/settings/serviceaccounts/adminsdk)
→ save as `firebase-service-account.json` (gitignored) → re-run backup scripts.

Add to your appeal:

> Please preserve all existing Firestore data (community posts, comments, user profiles),
> Storage files (images, STL files), and Authentication accounts during review.
> We are ready to complete a full data export immediately upon project restoration.

---

```bash
npm run build          # runs audit-dist-secrets.mjs automatically
npm run deploy:hosting # only after project is unsuspended
```

---

## Appeal email (reply to Google's suspension notice)

**Subject:** Appeal — Project dronehubgeorgia-a7bd5 suspension (credential leak remediated)

```
Hello Google Cloud Trust & Safety,

I am writing to appeal the suspension of project dronehubgeorgia-a7bd5 (DroneHub Georgia,
https://dronehub.ge), account dimitrikutchava@gmail.com.

We acknowledge that a Google Gemini API key was inadvertently exposed in our production
frontend JavaScript bundle between approximately 23 June and 2 July 2026. The exposure
was caused by a Vite build issue: a diagnostic component used dynamic import.meta.env[key]
lookups, which inlined the entire environment object (including VITE_GEMINI_API_KEY) into
the public dist/ output served from Firebase Hosting.

Remediation completed:
1. Removed dynamic env access and the diagnostic page that triggered the leak (commit ed35666).
2. Hardened firebase config to use only static import.meta.env.VITE_* reads.
3. Added an automated post-build scanner (scripts/audit-dist-secrets.mjs) that blocks deploy
   if secret material appears in dist/.
4. Revoked and rotated all Gemini API keys created before 2 July 2026.
5. Production Gemini calls use Firebase Functions proxy with secrets — never client-side keys.

The current live bundle no longer contains a Gemini API key value. We have reviewed audit
logs and removed any resources we did not authorise.

We request restoration of project dronehubgeorgia-a7bd5. We have implemented controls to
prevent recurrence and are happy to provide additional details if needed.

Thank you,
Dimitri Kutchava
DroneHub Georgia
dimitrikutchava@gmail.com
```

---

## Prevention rules (for contributors)

1. **Never** use `import.meta.env[variable]` — only static `import.meta.env.VITE_FOO`
2. **Never** put Gemini / Anthropic / service-account keys in `VITE_*` variables
3. `VITE_GEMINI_API_KEY` is for **local dev only** (`.env.local`, never committed)
4. Production AI → Firebase Functions `geminiProxy` only
5. `npm run build` must pass `audit-dist-secrets.mjs` before any deploy
