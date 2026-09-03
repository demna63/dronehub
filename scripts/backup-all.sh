#!/usr/bin/env bash
# Full Firebase backup.
# Defaults to the live project (dronehub-ge-1a1a6). To back up the OLD
# (suspended) project after it is reinstated, override:
#   PROJECT=dronehubgeorgia-a7bd5 BUCKET=dronehubgeorgia-a7bd5.firebasestorage.app ./scripts/backup-all.sh
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${1:-$HOME/Desktop/dronehub-backup-$(date +%Y-%m-%d)}"
PROJECT="${PROJECT:-dronehub-ge-1a1a6}"
BUCKET="${BUCKET:-dronehub-ge-1a1a6.firebasestorage.app}"

mkdir -p "$BACKUP_DIR"
echo "=== DroneHub backup → $BACKUP_DIR ==="

# 1. Firestore (server-side export — fastest, complete)
echo ""
echo "→ Firestore export to GCS…"
if gcloud firestore export "gs://${BUCKET}/backups/firestore-$(date +%Y-%m-%d)" \
  --project="$PROJECT" 2>/dev/null; then
  echo "  ✔ Firestore export started (check GCS backups/ folder)"
else
  echo "  ⚠ gcloud export failed — falling back to client script"
  node scripts/backup-firestore.mjs --out "$BACKUP_DIR"
fi

# 2. Storage (all files)
echo ""
echo "→ Storage download…"
if gsutil -m cp -r "gs://${BUCKET}/*" "$BACKUP_DIR/storage/" 2>/dev/null; then
  echo "  ✔ Storage copied"
else
  echo "  ⚠ gsutil failed — falling back to client script"
  node scripts/backup-storage.mjs --out "$BACKUP_DIR/storage"
fi

# 3. Auth users
#    `firebase auth:export` fails (HTTP 403) under user ADC without a quota
#    project, so fall back to the Identity Toolkit REST export which sends an
#    explicit X-Goog-User-Project header (see scripts/backup-auth.mjs).
echo ""
echo "→ Auth users export…"
if firebase auth:export "$BACKUP_DIR/auth-users.json" --project "$PROJECT" 2>/dev/null; then
  echo "  ✔ Auth users exported"
else
  echo "  ⚠ firebase auth:export failed (ADC quota) — falling back to REST…"
  PROJECT="$PROJECT" node scripts/backup-auth.mjs "$PROJECT" "$BACKUP_DIR/auth-users.json" \
    || echo "  ⚠ REST auth export also failed — export auth users manually"
fi

echo ""
echo "=== Done. Check $BACKUP_DIR ==="
