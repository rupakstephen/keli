"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { attachPhoto } from "@/lib/photoActions";

// Generic photo attachment -- pass exactly one of entryId/accomplishmentId.
// Client-upload pattern: bytes go straight from the browser to Blob storage,
// then attachPhoto() records the resulting URL against the target.
export function PhotoUploader({
  entryId,
  accomplishmentId,
  photos,
  revalidate,
}: {
  entryId?: string;
  accomplishmentId?: string;
  photos: { id: string; url: string }[];
  revalidate: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/photos/upload",
        clientPayload: JSON.stringify({
          entryId: entryId ?? null,
          accomplishmentId: accomplishmentId ?? null,
        }),
      });
      await attachPhoto({
        url: blob.url,
        entryId: entryId ?? null,
        accomplishmentId: accomplishmentId ?? null,
        revalidate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element -- external Blob URLs, no resizing pipeline for MVP
            <img
              key={photo.id}
              src={photo.url}
              alt=""
              className="h-20 w-20 rounded object-cover"
            />
          ))}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        disabled={uploading}
        className="text-sm"
      />
      {uploading && <p className="text-xs text-zinc-500">Uploading...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
