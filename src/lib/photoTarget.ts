// A Photo attaches to exactly one of Entry or Accomplishment -- enforced
// here in application code since the DB schema uses two nullable FKs rather
// than a constraint (same tradeoff already made for the Photo model itself).
export function validatePhotoTarget(target: {
  entryId: string | null;
  accomplishmentId: string | null;
}): { ok: true } | { ok: false; error: string } {
  const targetCount = [target.entryId, target.accomplishmentId].filter(Boolean).length;
  if (targetCount !== 1) {
    return { ok: false, error: "Exactly one of entryId or accomplishmentId is required" };
  }
  return { ok: true };
}
