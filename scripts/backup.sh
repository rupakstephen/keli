#!/usr/bin/env bash
set -euo pipefail

# Nightly backup: pg_dump (read-only Neon role) + Vercel Blob sync, both
# landing in Nextcloud's data directory so they show up as regular
# versioned files -- no separate storage system to run. Meant to run from
# cron inside the Nextcloud LXC (101 on `pve`), which only ever makes
# outbound connections (to Neon, to the Vercel Blob API); nothing about this
# requires exposing Nextcloud or the home network to the internet. Optionally
# rsyncs the result to a second machine (the Mac Mini `mini`) so the backup
# doesn't share a drive with the live Nextcloud data. See
# docs/implementation-plan.md "Backups".
#
# Required env (source from a .env.backup file kept off git, e.g. via
# `set -a; source /path/to/.env.backup; set +a` before calling this script):
#   BACKUP_DATABASE_URL   -- Neon connection string for the read-only role
#                            (NOT the app's main credential)
#   BLOB_READ_WRITE_TOKEN -- Vercel Blob API token (needs list + read access)
#   NEXTCLOUD_BACKUP_DIR  -- destination folder inside Nextcloud's data dir
# Optional:
#   OFFSITE_RSYNC_TARGET  -- rsync destination for a second copy on another
#                            machine, e.g. root@192.168.1.250:/root/keli-backups/
#                            (needs passwordless SSH from this host)

: "${BACKUP_DATABASE_URL:?Set BACKUP_DATABASE_URL}"
: "${BLOB_READ_WRITE_TOKEN:?Set BLOB_READ_WRITE_TOKEN}"
: "${NEXTCLOUD_BACKUP_DIR:?Set NEXTCLOUD_BACKUP_DIR}"

cd "$(dirname "$0")/.."

DB_DIR="$NEXTCLOUD_BACKUP_DIR/db"
PHOTOS_DIR="$NEXTCLOUD_BACKUP_DIR/photos"
mkdir -p "$DB_DIR" "$PHOTOS_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_PATH="$DB_DIR/keli-$TIMESTAMP.sql.gz"

# Write to a temp name and rename on success, so a failed dump never leaves a
# truncated keli-*.sql.gz that looks like a good backup.
pg_dump "$BACKUP_DATABASE_URL" | gzip > "$DUMP_PATH.partial"
mv "$DUMP_PATH.partial" "$DUMP_PATH"
echo "Database dump: $DUMP_PATH"

npx tsx scripts/backupBlobs.ts "$PHOTOS_DIR"

if [ -n "${OFFSITE_RSYNC_TARGET:-}" ]; then
  rsync -a "$NEXTCLOUD_BACKUP_DIR/" "$OFFSITE_RSYNC_TARGET"
  echo "Second copy synced to $OFFSITE_RSYNC_TARGET"
fi

echo "Backup complete."
