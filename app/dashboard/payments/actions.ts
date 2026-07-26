"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/dashboard/access";

function value(form: FormData, name: string) {
  const item = form.get(name);
  return typeof item === "string" ? item.trim() : "";
}

export async function recordPaymentAction(form: FormData) {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const invoiceId = value(form, "invoiceId");
  const amount = Number(value(form, "amount"));
  const paymentDate = value(form, "paymentDate");
  const method = value(form, "paymentMethod");
  const currency = value(form, "currency").toUpperCase();
  const result = await supabase.rpc("record_payment", {
    target_invoice_id: invoiceId,
    new_amount: amount,
    new_payment_date: paymentDate,
    new_payment_method: method,
    new_currency: currency,
    new_other_method_description: value(form, "otherMethodDescription") || undefined,
    new_external_reference: value(form, "externalReference") || undefined,
    new_notes: value(form, "notes") || undefined,
  });
  if (result.error || !result.data) {
    redirect(`/dashboard/invoices/${invoiceId}?error=${encodeURIComponent(result.error?.message || "Payment could not be recorded.")}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/receipts");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  redirect(`/dashboard/invoices/${invoiceId}?message=${encodeURIComponent("Payment recorded and receipt issued.")}`);
}

export async function reversePaymentAction(form: FormData) {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const paymentId = value(form, "paymentId");
  const result = await supabase.rpc("reverse_payment", {
    target_payment_id: paymentId,
    reason: value(form, "reason"),
  });
  if (result.error) redirect(`/dashboard/payments/${paymentId}?error=${encodeURIComponent(result.error.message)}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/payments/${paymentId}`);
  redirect(`/dashboard/payments/${paymentId}?message=${encodeURIComponent("Payment reversed and invoice balance recalculated.")}`);
}

export async function uploadPaymentProofAction(form: FormData) {
  const { supabase, user } = await requireRoles(["administrator", "accountant"]);
  const paymentId = value(form, "paymentId");
  const file = form.get("proof");
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) {
    redirect(`/dashboard/payments/${paymentId}?error=${encodeURIComponent("Choose a PDF, JPG or PNG proof up to 5 MB.")}`);
  }
  const allowed = new Set(["application/pdf", "image/jpeg", "image/png"]);
  if (!allowed.has(file.type)) redirect(`/dashboard/payments/${paymentId}?error=${encodeURIComponent("That proof file type is not allowed.")}`);
  const path = `${paymentId}/${crypto.randomUUID()}-${file.name.replace(/[^A-Za-z0-9._-]/g, "_")}`;
  const uploaded = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) redirect(`/dashboard/payments/${paymentId}?error=${encodeURIComponent("Proof upload failed. The payment remains valid; try again.")}`);
  const metadata = await supabase.from("payment_proofs").insert({ payment_id: paymentId, storage_path: path, original_filename: file.name, mime_type: file.type, file_size: file.size, uploaded_by: user.id }).select("id").single();
  if (metadata.error) {
    await supabase.storage.from("payment-proofs").remove([path]);
    redirect(`/dashboard/payments/${paymentId}?error=${encodeURIComponent("Proof metadata could not be saved. The uploaded file was cleaned up; try again.")}`);
  }
  revalidatePath(`/dashboard/payments/${paymentId}`);
  redirect(`/dashboard/payments/${paymentId}?message=${encodeURIComponent("Proof of payment uploaded securely.")}`);
}
