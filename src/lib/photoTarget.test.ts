import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePhotoTarget } from "./photoTarget";

test("accepts entryId alone", () => {
  assert.deepEqual(validatePhotoTarget({ entryId: "e1", accomplishmentId: null }), {
    ok: true,
  });
});

test("accepts accomplishmentId alone", () => {
  assert.deepEqual(
    validatePhotoTarget({ entryId: null, accomplishmentId: "a1" }),
    { ok: true }
  );
});

test("rejects neither set", () => {
  const result = validatePhotoTarget({ entryId: null, accomplishmentId: null });
  assert.equal(result.ok, false);
});

test("rejects both set", () => {
  const result = validatePhotoTarget({ entryId: "e1", accomplishmentId: "a1" });
  assert.equal(result.ok, false);
});
