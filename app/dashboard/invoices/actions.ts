"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/dashboard/access";
import type { DocumentFormState } from "@/lib/dashboard/document-types";
import { validateDocumentForm } from "@/lib/dashboard/document-validation";

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeInvoiceError(message: string) {
  if (
    message.includes("changed after you opened it") ||
    message.includes("40001")
  ) {
    return "This invoice was changed by another session. Refresh the page before trying again.";
  }
  if (message.includes("immutable") || message.includes("Only draft")) {
    return "This invoice is no longer editable because its financial snapshot is preserved.";
  }
  if (message.includes("permission") || message.includes("cannot")) {
    return "You do not have permission to complete that invoice action.";
  }
  if (message.includes("client")) {
    return "The selected client is unavailable.";
  }

  return "The invoice could not be saved. Review the details and try again.";
}

function invoiceRpcArguments(
  validation: ReturnType<typeof validateDocumentForm>,
) {
  return {
    new_client_id: validation.values.clientId,
    new_subject: validation.values.subject,
    new_notes: validation.values.notes,
    new_terms_conditions: validation.values.termsConditions,
    new_currency: validation.values.currency,
    new_issue_date: validation.values.issueDate,
    new_due_date: validation.values.secondaryDate,
    new_discount_type: validation.values.discountType,
    new_discount_value: validation.parsed.discountValue,
    new_tax_mode: validation.values.taxMode,
    new_tax_rate: validation.parsed.taxRate,
    new_tax_label: validation.values.taxLabel,
    new_items: validation.parsed.items,
  };
}

export async function createInvoiceAction(
  _previousState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const validation = validateDocumentForm(formData, "invoice");

  if (!validation.valid) {
    return {
      values: validation.values,
      fieldErrors: validation.fieldErrors,
      formError: "Correct the highlighted invoice fields.",
    };
  }

  const { data, error } = await supabase.rpc(
    "create_invoice",
    invoiceRpcArguments(validation),
  );

  if (error || !data) {
    return {
      values: validation.values,
      fieldErrors: {},
      formError: safeInvoiceError(error?.message || ""),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  redirect(
    `/dashboard/invoices/${data.id}?message=${encodeURIComponent(
      "The invoice was saved as a draft.",
    )}`,
  );
}

export async function updateInvoiceAction(
  invoiceId: string,
  _previousState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const validation = validateDocumentForm(formData, "invoice");

  if (!validation.valid || validation.parsed.lockVersion === undefined) {
    return {
      values: validation.values,
      fieldErrors: {
        ...validation.fieldErrors,
        ...(validation.parsed.lockVersion === undefined
          ? {
              lockVersion:
                "The record version is missing. Refresh the page before saving.",
            }
          : {}),
      },
      formError: "Correct the highlighted invoice fields.",
    };
  }

  const { data, error } = await supabase.rpc("update_invoice", {
    target_invoice_id: invoiceId,
    expected_lock_version: validation.parsed.lockVersion,
    ...invoiceRpcArguments(validation),
  });

  if (error || !data) {
    return {
      values: validation.values,
      fieldErrors: {},
      formError: safeInvoiceError(error?.message || ""),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  redirect(
    `/dashboard/invoices/${invoiceId}?message=${encodeURIComponent(
      "The draft invoice was updated.",
    )}`,
  );
}

export async function issueInvoiceAction(formData: FormData) {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const invoiceId = formString(formData, "invoiceId");
  const lockVersion = Number(formString(formData, "lockVersion"));
  const confirmed = formString(formData, "confirmed") === "yes";

  if (!invoiceId || !Number.isInteger(lockVersion) || !confirmed) {
    redirect(
      `/dashboard/invoices/${invoiceId}?error=${encodeURIComponent(
        "Confirm invoice issue before continuing.",
      )}`,
    );
  }

  const { data, error } = await supabase.rpc("issue_invoice", {
    target_invoice_id: invoiceId,
    expected_lock_version: lockVersion,
  });

  if (error || !data) {
    redirect(
      `/dashboard/invoices/${invoiceId}?error=${encodeURIComponent(
        safeInvoiceError(error?.message || ""),
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  redirect(
    `/dashboard/invoices/${invoiceId}?message=${encodeURIComponent(
      `${data.invoice_number} was issued.`,
    )}`,
  );
}

export async function cancelInvoiceAction(formData: FormData) {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const invoiceId = formString(formData, "invoiceId");
  const lockVersion = Number(formString(formData, "lockVersion"));
  const cancellationReason = formString(formData, "cancellationReason");
  const confirmed = formString(formData, "confirmed") === "yes";

  if (
    !invoiceId ||
    !Number.isInteger(lockVersion) ||
    !confirmed ||
    cancellationReason.length < 3
  ) {
    redirect(
      `/dashboard/invoices/${invoiceId}?error=${encodeURIComponent(
        "Confirm cancellation and provide a reason.",
      )}`,
    );
  }

  const { error } = await supabase.rpc("cancel_invoice", {
    target_invoice_id: invoiceId,
    expected_lock_version: lockVersion,
    requested_cancellation_reason: cancellationReason,
  });

  if (error) {
    redirect(
      `/dashboard/invoices/${invoiceId}?error=${encodeURIComponent(
        safeInvoiceError(error.message),
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  redirect(
    `/dashboard/invoices/${invoiceId}?message=${encodeURIComponent(
      "The invoice was cancelled and retained for the audit trail.",
    )}`,
  );
}

export async function refreshInvoiceSnapshotsAction(formData: FormData) {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const invoiceId = formString(formData, "invoiceId");
  const lockVersion = Number(formString(formData, "lockVersion"));
  const confirmed = formString(formData, "confirmed") === "yes";

  if (!invoiceId || !Number.isInteger(lockVersion) || !confirmed) {
    redirect(
      `/dashboard/invoices/${invoiceId}?error=${encodeURIComponent(
        "Confirm the snapshot refresh before continuing.",
      )}`,
    );
  }

  const { error } = await supabase.rpc("refresh_invoice_snapshots", {
    target_invoice_id: invoiceId,
    expected_lock_version: lockVersion,
  });

  if (error) {
    redirect(
      `/dashboard/invoices/${invoiceId}?error=${encodeURIComponent(
        safeInvoiceError(error.message),
      )}`,
    );
  }

  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  redirect(
    `/dashboard/invoices/${invoiceId}?message=${encodeURIComponent(
      "Draft client and company details were refreshed.",
    )}`,
  );
}
