import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAccomplishmentInput } from "./accomplishmentInput";

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

test("parses valid input", () => {
  const result = parseAccomplishmentInput(
    formData({ title: " First 5k ", description: " Ran it. ", achievedAt: "2026-01-01" })
  );
  assert.ok(result);
  assert.equal(result?.title, "First 5k");
  assert.equal(result?.description, "Ran it.");
  assert.equal(result?.achievedAt.toISOString().slice(0, 10), "2026-01-01");
});

test("rejects missing title", () => {
  assert.equal(
    parseAccomplishmentInput(formData({ title: "  ", description: "x", achievedAt: "2026-01-01" })),
    null
  );
});

test("rejects missing description", () => {
  assert.equal(
    parseAccomplishmentInput(formData({ title: "x", description: " ", achievedAt: "2026-01-01" })),
    null
  );
});

test("rejects invalid date", () => {
  assert.equal(
    parseAccomplishmentInput(formData({ title: "x", description: "y", achievedAt: "not-a-date" })),
    null
  );
});
