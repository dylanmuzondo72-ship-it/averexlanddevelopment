"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/dashboard/access";
import type {
  DocumentFormState,
  QuotationStatus,
} from "@/lib/dashboard/document-types";
import { validateDocumentForm } from "@/lib/dashboard/document-validation";

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeQuotationError(message: string) {
  if (
    message.includes("changed after you opened it") ||
    message.includes("40001")
  ) {
    return "This quotation was changed by another session. Refresh the page before trying again.";
  }
  if (message.includes("expired quotation")) {
    return "This quotation has expired and cannot be sent.";
  }
  if (message.includes("immutable") || message.includes("Only draft")) {
    return "This quotation is no longer editable. Create a revision when changes are required.";
  }
  if (message.includes("permission") || message.includes("cannot")) {
    return "You do not have permission to complete that quotation action.";
  }
  if (message.includes("client")) {
    return "The selected client is unavailable or outside your permitted records.";
  }

  return "The quotation could not be saved. Review the details and try again.";
}

function quotationRpcArguments(
  validation: ReturnType<typeof validateDocumentForm>,
) {
  return {
    new_client_id: validation.values.clientId,
    new_subject: validation.values.subject,
    new_introduction: validation.values.introduction,
    new_notes: validation.values.notes,
    new_terms_conditions: validation.values.termsConditions,
    new_currency: validation.values.currency,
    new_issue_date: validation.values.issueDate,
    new_expiry_date: validation.values.secondaryDate,
    new_discount_type: validation.values.discountType,
    new_discount_value: validation.parsed.discountValue,
    new_tax_mode: validation.values.taxMode,
    new_tax_rate: validation.parsed.taxRate,
    new_tax_label: validation.values.taxLabel,
    new_assigned_to:
      validation.values.assignedTo || (null as unknown as string),
    new_items: validation.parsed.items,
  };
}

export async function createQuotationAction(
  _previousState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { supabase } = await requireRoles(["administrator", "staff"]);
  const validation = validateDocumentForm(formData, "quotation");

  if (!validation.valid) {
    return {
      values: validation.values,
      fieldErrors: validation.fieldErrors,
      formError: "Correct the highlighted quotation fields.",
    };
  }

  const { data, error } = await supabase.rpc(
    "create_quotation",
    quotationRpcArguments(validation),
  );

  if (error || !data) {
    return {
      values: validation.values,
      fieldErrors: {},
      formError: safeQuotationError(error?.message || ""),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/quotes");
  redirect(
    `/dashboard/quotes/${data.id}?message=${encodeURIComponent(
      `${data.quote_number} was saved as a draft.`,
    )}`,
  );
}

export async function updateQuotationAction(
  quotationId: string,
  _previousState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { supabase } = await requireRoles(["administrator", "staff"]);
  const validation = validateDocumentForm(formData, "quotation");

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
      formError: "Correct the highlighted quotation fields.",
    };
  }

  const { data, error } = await supabase.rpc("update_quotation", {
    target_quotation_id: quotationId,
    expected_lock_version: validation.parsed.lockVersion,
    ...quotationRpcArguments(validation),
  });

  if (error || !data) {
    return {
      values: validation.values,
      fieldErrors: {},
      formError: safeQuotationError(error?.message || ""),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${quotationId}`);
  redirect(
    `/dashboard/quotes/${quotationId}?message=${encodeURIComponent(
      `${data.quote_number} was updated.`,
    )}`,
  );
}

export async function transitionQuotationAction(formData: FormData) {
  const { supabase } = await requireRoles(["administrator", "staff"]);
  const quotationId = formString(formData, "quotationId");
  const lockVersion = Number(formString(formData, "lockVersion"));
  const requestedStatus = formString(formData, "status") as QuotationStatus;
  const cancellationReason = formString(formData, "cancellationReason");
  const confirmed = formString(formData, "confirmed") === "yes";

  if (!quotationId || !Number.isInteger(lockVersion) || !confirmed) {
    redirect(
      `/dashboard/quotes/${quotationId}?error=${encodeURIComponent(
        "Confirm the status change before continuing.",
      )}`,
    );
  }

  const { data, error } = await supabase.rpc("transition_quotation", {
    target_quotation_id: quotationId,
    expected_lock_version: lockVersion,
    requested_status: requestedStatus,
    ...(cancellationReason
      ? { requested_cancellation_reason: cancellationReason }
      : {}),
  });

  if (error || !data) {
    redirect(
      `/dashboard/quotes/${quotationId}?error=${encodeURIComponent(
        safeQuotationError(error?.message || ""),
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${quotationId}`);
  redirect(
    `/dashboard/quotes/${quotationId}?message=${encodeURIComponent(
      `${data.quote_number} is now ${requestedStatus}.`,
    )}`,
  );
}

export async function createQuotationRevisionAction(formData: FormData) {
  const { supabase } = await requireRoles(["administrator", "staff"]);
  const quotationId = formString(formData, "quotationId");
  const lockVersion = Number(formString(formData, "lockVersion"));
  const confirmed = formString(formData, "confirmed") === "yes";

  if (!quotationId || !Number.isInteger(lockVersion) || !confirmed) {
    redirect(
      `/dashboard/quotes/${quotationId}?error=${encodeURIComponent(
        "Confirm revision creation before continuing.",
      )}`,
    );
  }

  const { data, error } = await supabase.rpc("create_quotation_revision", {
    target_quotation_id: quotationId,
    expected_lock_version: lockVersion,
  });

  if (error || !data) {
    redirect(
      `/dashboard/quotes/${quotationId}?error=${encodeURIComponent(
        safeQuotationError(error?.message || ""),
      )}`,
    );
  }

  revalidatePath("/dashboard/quotes");
  redirect(
    `/dashboard/quotes/${data.id}?message=${encodeURIComponent(
      `${data.quote_number} was created as an editable revision.`,
    )}`,
  );
}

export async function convertQuotationAction(formData: FormData) {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const quotationId = formString(formData, "quotationId");
  const lockVersion = Number(formString(formData, "lockVersion"));
  const confirmed = formString(formData, "confirmed") === "yes";

  if (!quotationId || !Number.isInteger(lockVersion) || !confirmed) {
    redirect(
      `/dashboard/quotes/${quotationId}?error=${encodeURIComponent(
        "Confirm the quote-to-invoice conversion before continuing.",
      )}`,
    );
  }

  const { data, error } = await supabase.rpc(
    "convert_quotation_to_invoice",
    {
      target_quotation_id: quotationId,
      expected_lock_version: lockVersion,
    },
  );

  if (error || !data) {
    redirect(
      `/dashboard/quotes/${quotationId}?error=${encodeURIComponent(
        safeQuotationError(error?.message || ""),
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/invoices");
  redirect(
    `/dashboard/invoices/${data.id}?message=${encodeURIComponent(
      "A linked draft invoice was created.",
    )}`,
  );
}

export async function refreshQuotationSnapshotsAction(formData: FormData) {
  const { supabase } = await requireRoles(["administrator", "staff"]);
  const quotationId = formString(formData, "quotationId");
  const lockVersion = Number(formString(formData, "lockVersion"));
  const confirmed = formString(formData, "confirmed") === "yes";

  if (!quotationId || !Number.isInteger(lockVersion) || !confirmed) {
    redirect(
      `/dashboard/quotes/${quotationId}?error=${encodeURIComponent(
        "Confirm the snapshot refresh before continuing.",
      )}`,
    );
  }

  const { error } = await supabase.rpc("refresh_quotation_snapshots", {
    target_quotation_id: quotationId,
    expected_lock_version: lockVersion,
  });

  if (error) {
    redirect(
      `/dashboard/quotes/${quotationId}?error=${encodeURIComponent(
        safeQuotationError(error.message),
      )}`,
    );
  }

  revalidatePath(`/dashboard/quotes/${quotationId}`);
  redirect(
    `/dashboard/quotes/${quotationId}?message=${encodeURIComponent(
      "Draft client and company details were refreshed.",
    )}`,
  );
}
