import { supabase } from "@/integrations/supabase/client";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type PublicBucket = "avatars" | "community-covers";

interface ResizeOptions {
  maxSide: number;
  /** Crop to a centred square (avatars). */
  square?: boolean;
}

/** Validate, shrink in the browser (saves bandwidth), and return a WebP blob. */
export async function prepareImage(file: File, { maxSide, square }: ResizeOptions): Promise<Blob> {
  if (!ALLOWED.includes(file.type)) throw new Error("Use a PNG, JPG or WEBP image.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("That image is over 8 MB. Choose a smaller one.");
  const bitmap = await createImageBitmap(file);
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (square) {
    const side = Math.min(sw, sh);
    sx = Math.floor((sw - side) / 2);
    sy = Math.floor((sh - side) / 2);
    sw = side;
    sh = side;
  }
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process that image.");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
  if (!blob) throw new Error("Your browser could not process that image.");
  return blob;
}

/** Upload to the signed-in user's own folder in a public bucket and return the public URL. */
export async function uploadPublicImage(opts: {
  bucket: PublicBucket;
  userId: string;
  name: string;
  file: File;
  resize: ResizeOptions;
}): Promise<string> {
  const blob = await prepareImage(opts.file, opts.resize);
  const path = `${opts.userId}/${opts.name}-${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from(opts.bucket)
    .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(opts.bucket).getPublicUrl(path).data.publicUrl;
}
