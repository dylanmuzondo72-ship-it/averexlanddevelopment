"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/dashboard/access";
import { isUuid, mediaMetadataPatch, validMediaFile } from "@/lib/dashboard/land-media-validation";
import type { Enums } from "@/lib/supabase/database.types";

const text = (form: FormData, key: string) => String(form.get(key) || "").trim();
const safeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-120);
const targetPath = (developmentId?: string | null, unitId?: string | null) => `/dashboard/land/${unitId ? `units/${unitId}` : `developments/${developmentId}`}`;
function fail(path: string, message: string): never { redirect(`${path}?error=${encodeURIComponent(message)}`); }

async function editableMedia(form: FormData) {
  const session = await requireRoles(["administrator", "staff"]);
  const id = text(form, "mediaId");
  if (!isUuid(id)) fail("/dashboard/land", "Invalid media ID");
  const { data: item, error } = await session.supabase.from("land_media").select("*").eq("id", id).is("archived_at", null).maybeSingle();
  if (error || !item) fail("/dashboard/land", "Media unavailable");
  return { ...session, item, back: targetPath(item.development_id, item.land_unit_id) };
}

export async function uploadLandMediaAction(form: FormData) {
  const { supabase, profile } = await requireRoles(["administrator", "staff"]);
  const developmentId = text(form, "developmentId"), unitId = text(form, "unitId");
  if (!!developmentId === !!unitId || !isUuid(unitId || developmentId)) fail("/dashboard/land", "Choose one valid media parent");
  const back = targetPath(developmentId, unitId);
  const parent = unitId
    ? await supabase.from("land_units").select("id").eq("id", unitId).is("archived_at", null).maybeSingle()
    : await supabase.from("land_developments").select("id").eq("id", developmentId).is("archived_at", null).maybeSingle();
  if (parent.error || !parent.data) fail(back, "Parent unavailable");
  const file = form.get("file"), mediaType = text(form, "mediaType"), isDocument = mediaType === "document";
  if (!["photo", "site_plan", "map", "document"].includes(mediaType) || !(file instanceof File) || !await validMediaFile(file, isDocument)) fail(back, "Choose a matching JPEG, PNG, WebP or PDF file up to 4 MiB");
  const bucket = isDocument ? "land-documents" : "land-media";
  const path = `${unitId ? `units/${unitId}` : `developments/${developmentId}`}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const uploaded = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) fail(back, "Upload failed");
  const { data, error } = await supabase.from("land_media").insert({
    development_id: developmentId || null, land_unit_id: unitId || null,
    media_type: (isDocument ? "other_document" : mediaType) as Enums<"land_media_type">,
    storage_bucket: bucket, storage_path: path, original_filename: file.name,
    mime_type: file.type, file_size: file.size, caption: text(form, "caption") || null,
    alt_text: text(form, "altText") || null, created_by: profile.id, updated_by: profile.id,
  }).select("id").single();
  if (error || !data) {
    const cleanup = await supabase.storage.from(bucket).remove([path]);
    fail(back, cleanup.error ? "Media record failed; uploaded file needs administrator cleanup" : "Media record failed");
  }
  revalidatePath(back); redirect(`${back}?message=Media+uploaded`);
}

export async function setLandMediaCoverAction(form: FormData) {
  const { supabase, item, back } = await editableMedia(form);
  const { error } = await supabase.rpc("set_land_media_cover", { target_id: item.id });
  if (error) fail(back, "Cover update failed");
  revalidatePath(back);
}
export async function archiveLandMediaAction(form: FormData) {
  const { supabase, item, back } = await editableMedia(form);
  const { error } = await supabase.from("land_media").update({ archived_at: new Date().toISOString(), is_cover: false }).eq("id", item.id);
  if (error) fail(back, "Archive failed");
  revalidatePath(back);
}
export async function updateLandMediaAction(form: FormData) {
  const { supabase, item, back } = await editableMedia(form);
  let patch;
  try { patch = mediaMetadataPatch(form); } catch { fail(back, "Invalid media metadata"); }
  const { error } = await supabase.from("land_media").update(patch).eq("id", item.id);
  if (error) fail(back, "Media update failed");
  revalidatePath(back);
}
export async function reorderLandMediaAction(form: FormData) {
  const { supabase, item, back } = await editableMedia(form);
  const order = Number(form.get("sortOrder"));
  if (!form.has("sortOrder") || !Number.isSafeInteger(order) || order < 0 || order > 2147483647) fail(back, "Invalid media order");
  const { error } = await supabase.from("land_media").update({ sort_order: order }).eq("id", item.id);
  if (error) fail(back, "Reorder failed");
  revalidatePath(back);
}
export async function moveLandMediaAction(form: FormData) {
  const { supabase, item, back } = await editableMedia(form);
  const direction = Number(form.get("direction"));
  if (![-1, 1].includes(direction)) fail(back, "Invalid direction");
  const { error } = await supabase.rpc("move_land_media", { target_id: item.id, move_direction: direction });
  if (error) fail(back, "Reorder failed");
  revalidatePath(back);
}
export async function replaceLandMediaAction(form: FormData) {
  const { supabase, profile, item: old, back } = await editableMedia(form);
  const file = form.get("file");
  if (!(file instanceof File) || !await validMediaFile(file, old.storage_bucket === "land-documents")) fail(back, "Choose a matching replacement up to 4 MiB");
  const path = `${old.land_unit_id ? `units/${old.land_unit_id}` : `developments/${old.development_id}`}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const uploaded = await supabase.storage.from(old.storage_bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) fail(back, "Replacement upload failed");
  // Compare-and-swap prevents a concurrent replacement from overwriting this one.
  const result = await supabase.from("land_media").update({
    storage_path: path, original_filename: file.name, mime_type: file.type,
    file_size: file.size, updated_by: profile.id, rotation: 0, crop_data: { zoom: 1, x: 0, y: 0 },
    approval_status: "pending", visibility: "internal",
  }).eq("id", old.id).eq("storage_path", old.storage_path).is("archived_at", null).select("id").maybeSingle();
  if (result.error || !result.data) {
    const cleanup = await supabase.storage.from(old.storage_bucket).remove([path]);
    fail(back, cleanup.error ? "Replacement failed; uploaded file needs administrator cleanup" : "Replacement failed or media changed; reload and retry");
  }
  const cleanup = await supabase.storage.from(old.storage_bucket).remove([old.storage_path]);
  revalidatePath(back);
  if (cleanup.error) fail(back, "Replacement saved; previous private file needs administrator cleanup");
}
export async function getLandMediaUrlAction(form: FormData) {
  const { supabase } = await requireRoles(["administrator", "staff", "accountant", "viewer"]);
  const id = text(form, "mediaId");
  if (!isUuid(id)) fail("/dashboard/land", "Invalid media ID");
  const { data: item } = await supabase.from("land_media").select("storage_bucket,storage_path,development_id,land_unit_id").eq("id", id).is("archived_at", null).maybeSingle();
  if (!item) fail("/dashboard/land", "Media unavailable");
  const signed = await supabase.storage.from(item.storage_bucket).createSignedUrl(item.storage_path, 300);
  if (signed.data?.signedUrl) redirect(signed.data.signedUrl);
  fail(targetPath(item.development_id, item.land_unit_id), "Could not open private file");
}
