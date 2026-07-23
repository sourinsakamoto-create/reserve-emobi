import { put } from "@vercel/blob";

// Vercel's serverless functions hard-cap request bodies at 4.5MB regardless
// of Next.js's own serverActions.bodySizeLimit setting, so this needs to
// stay safely under that (with headroom for multipart/form-data overhead)
// or uploads would fail with a platform-level 413 instead of this message.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export class UploadError extends Error {}

/**
 * Uploads an activity hero image to Vercel Blob and returns its public URL.
 * Uses BLOB_READ_WRITE_TOKEN if set, otherwise falls back to Vercel's OIDC
 * token + BLOB_STORE_ID (both auto-provided once a Blob store is connected
 * to the project) — no manual token setup is required either way.
 */
export async function uploadActivityImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError("画像はJPEG・PNG・WebP・GIF形式のみアップロードできます。");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError("画像サイズは4MB以下にしてください。");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`activity-images/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return blob.url;
}
