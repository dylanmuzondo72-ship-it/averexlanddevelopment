import type { Tables } from "../supabase/database.types";

// Leave multipart overhead below the hosting platform's request-body limit.
export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function validMediaFile(file: File, document: boolean) {
  if (file.size <= 0 || file.size > MAX_MEDIA_BYTES) return false;
  if (document ? file.type !== "application/pdf" : !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return false;
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  switch (file.type) {
    case "application/pdf": return ascii(0, 5) === "%PDF-";
    case "image/jpeg": return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png": return [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value);
    case "image/webp": return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    default: return false;
  }
}

export function mediaMetadataPatch(form: FormData) {
  const patch: Partial<Tables<"land_media">> = {};
  for (const [field, column] of [["caption", "caption"], ["altText", "alt_text"]] as const) {
    if (form.has(field)) patch[column] = String(form.get(field) || "").trim().slice(0, 2000) || null;
  }
  if (form.has("visibility")) {
    const value = String(form.get("visibility"));
    if (value !== "internal" && value !== "public_candidate") throw new Error("Invalid visibility");
    patch.visibility = value;
  }
  if (form.has("approval")) {
    const value = String(form.get("approval"));
    if (value !== "pending" && value !== "approved" && value !== "rejected") throw new Error("Invalid approval");
    patch.approval_status = value;
  }
  const numeric = (key: string, min: number, max: number) => {
    const value = Number(form.get(key));
    if (!form.has(key) || !Number.isFinite(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  };
  if (["rotation", "zoom", "x", "y"].some(key => form.has(key))) {
    patch.rotation = Math.round(numeric("rotation", 0, 359));
    patch.crop_data = { zoom: numeric("zoom", 1, 3), x: numeric("x", -120, 120), y: numeric("y", -120, 120) };
  }
  return patch;
}
