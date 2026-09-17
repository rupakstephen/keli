import fs from "node:fs";
import path from "node:path";
import { list } from "@vercel/blob";
import { selectNewBlobs } from "../src/lib/backupBlobs";

// Downloads any Blob object uploaded since the last run into destDir,
// mirroring the store's pathnames. State lives in a marker file rather than
// a database row -- this script only ever runs from the Pi5 cron job.
async function main() {
  const destDir = process.argv[2];
  if (!destDir) {
    console.error("Usage: tsx scripts/backupBlobs.ts <dest-dir>");
    process.exit(1);
  }

  fs.mkdirSync(destDir, { recursive: true });
  const markerPath = path.join(destDir, ".last-backup-at");
  const since = fs.existsSync(markerPath)
    ? new Date(fs.readFileSync(markerPath, "utf8").trim())
    : null;

  const { blobs } = await list();
  const newBlobs = selectNewBlobs(blobs, since);

  for (const blob of newBlobs) {
    const response = await fetch(blob.url);
    if (!response.ok) {
      throw new Error(`Failed to download ${blob.pathname}: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const destPath = path.join(destDir, blob.pathname);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
  }

  fs.writeFileSync(markerPath, new Date().toISOString());
  console.log(`Backed up ${newBlobs.length} new/changed photo(s) to ${destDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
