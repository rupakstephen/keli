// Blob storage has no built-in "since" filter, so the nightly backup lists
// everything and does this filtering itself against the last run's marker.
export function selectNewBlobs<T extends { uploadedAt: string | Date }>(
  blobs: T[],
  since: Date | null
): T[] {
  if (!since) return blobs;
  return blobs.filter((b) => new Date(b.uploadedAt) > since);
}
