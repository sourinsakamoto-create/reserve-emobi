import { put } from "@vercel/blob";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export class UploadError extends Error {}

/**
 * Uploads an activity hero image to Vercel Blob and returns its public URL.
 * Requires the BLOB_READ_WRITE_TOKEN env var (auto-set once a Blob store is
 * connected to the Vercel project).
 */
export async function uploadActivityImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError("画像はJPEG・PNG・WebP・GIF形式のみアップロードできます。");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError("画像サイズは5MB以下にしてください。");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`activity-images/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return blob.url;
}
