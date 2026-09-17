import { test } from "node:test";
import assert from "node:assert/strict";
import { selectNewBlobs } from "./backupBlobs";

const blobs = [
  { pathname: "a.jpg", url: "https://x/a.jpg", uploadedAt: "2026-01-01T00:00:00.000Z" },
  { pathname: "b.jpg", url: "https://x/b.jpg", uploadedAt: "2026-01-05T00:00:00.000Z" },
  { pathname: "c.jpg", url: "https://x/c.jpg", uploadedAt: "2026-01-10T00:00:00.000Z" },
];

test("returns all blobs when there's no prior run", () => {
  assert.equal(selectNewBlobs(blobs, null).length, 3);
});

test("returns only blobs uploaded after the cutoff", () => {
  const result = selectNewBlobs(blobs, new Date("2026-01-05T00:00:00.000Z"));
  assert.deepEqual(
    result.map((b) => b.pathname),
    ["c.jpg"]
  );
});

test("returns none when cutoff is after every upload", () => {
  assert.equal(selectNewBlobs(blobs, new Date("2026-02-01T00:00:00.000Z")).length, 0);
});
