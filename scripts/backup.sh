#!/usr/bin/env bash
set -euo pipefail

# Nightly backup: pg_dump (read-only Neon role) + Vercel Blob sync, both
# landing in the Pi5's Nextcloud data directory so they show up as regular
# versioned files -- no separate storage system to run. Meant to run from
# cron on the Pi5, which only ever makes outbound connections (to Neon, to
# the Vercel Blob API); nothing about this requires exposing Nextcloud or
# the home network to the internet. See docs/implementation-plan.md
# "Backups".
#
# Required env (source from a .env.backup file kept off git, e.g. via
# `set -a; source /path/to/.env.backup; set +a` before calling this script):
#   BACKUP_DATABASE_URL   -- Neon connection string for the read-only role
#                            (NOT the app's main credential)
#   BLOB_READ_WRITE_TOKEN -- Vercel Blob API token (needs list + read access)
#   NEXTCLOUD_BACKUP_DIR  -- destination folder inside Nextcloud's data dir

: "${BACKUP_DATABASE_URL:?Set BACKUP_DATABASE_URL}"
: "${BLOB_READ_WRITE_TOKEN:?Set BLOB_READ_WRITE_TOKEN}"
: "${NEXTCLOUD_BACKUP_DIR:?Set NEXTCLOUD_BACKUP_DIR}"

cd "$(dirname "$0")/.."

DB_DIR="$NEXTCLOUD_BACKUP_DIR/db"
PHOTOS_DIR="$NEXTCLOUD_BACKUP_DIR/photos"
mkdir -p "$DB_DIR" "$PHOTOS_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_PATH="$DB_DIR/keli-$TIMESTAMP.sql.gz"

pg_dump "$BACKUP_DATABASE_URL" | gzip > "$DUMP_PATH"
echo "Database dump: $DUMP_PATH"

npx tsx scripts/backupBlobs.ts "$PHOTOS_DIR"

echo "Backup complete."
