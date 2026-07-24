"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRoles } from "@/lib/dashboard/access";
import {
  getFormString,
  type ClientFormState,
  validateClientForm,
} from "@/lib/dashboard/client-validation";

function safeDatabaseError(message: string) {
  if (message.includes("Assigned staff profile is not active")) {
    return "The selected staff profile is no longer active.";
  }
  if (message.includes("Staff may only edit active clients")) {
    return "Staff may only edit active clients.";
  }
  if (message.includes("Client not found")) {
    return "The client record could not be found.";
  }
  if (message.includes("permission")) {
    return "You do not have permission to complete that action.";
  }

  return "The client record could not be saved. Review the details and try again.";
}

async function findDuplicates(
  supabase: Awaited<ReturnType<typeof requireRoles>>["supabase"],
  email: string,
  phone: string,
  excludedClientId?: string,
) {
  const { data, error } = await supabase.rpc("find_client_duplicates", {
    ...(email ? { candidate_email: email } : {}),
    ...(phone ? { candidate_phone: phone } : {}),
    ...(excludedClientId ? { excluded_client_id: excludedClientId } : {}),
  });

  if (error) return [];
  return (data || []).map((item) => ({
    clientReference: item.client_reference,
    displayName: item.display_name,
  }));
}

export async function createClientAction(
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const { supabase } = await requireRoles(["administrator", "staff"]);
  const validation = validateClientForm(formData);

  if (!validation.valid) {
    return {
      values: validation.values,
      fieldErrors: validation.fieldErrors,
      formError: "Correct the highlighted fields.",
    };
  }

  const duplicates = await findDuplicates(
    supabase,
    validation.values.email,
    validation.values.phone,
  );
  const duplicateConfirmed =
    getFormString(formData, "confirmDuplicate") === "yes";

  if (duplicates.length > 0 && !duplicateConfirmed) {
    return {
      values: validation.values,
      fieldErrors: {},
      duplicateWarning:
        "A client with a matching email address or phone number already exists.",
      duplicates,
    };
  }

  const { data, error } = await supabase.rpc("create_client", {
    new_client_type: validation.values.clientType,
    new_display_name: validation.values.displayName,
    new_company_name: validation.values.companyName,
    new_contact_person: validation.values.contactPerson,
    new_email: validation.values.email,
    new_phone: validation.values.phone,
    new_alternative_phone: validation.values.alternativePhone,
    new_physical_address: validation.values.physicalAddress,
    new_billing_address: validation.values.billingAddress,
    new_tax_number: validation.values.taxNumber,
    new_notes: validation.values.notes,
    ...(validation.values.assignedTo
      ? { new_assigned_to: validation.values.assignedTo }
      : {}),
  });

  if (error || !data) {
    return {
      values: validation.values,
      fieldErrors: {},
      formError: safeDatabaseError(error?.message || ""),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  redirect(
    `/dashboard/clients/${data.id}?message=${encodeURIComponent(
      `${data.client_reference} was created successfully.`,
    )}`,
  );
}

export async function updateClientAction(
  clientId: string,
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const { supabase } = await requireRoles(["administrator", "staff"]);
  const validation = validateClientForm(formData);

  if (!validation.valid) {
    return {
      values: validation.values,
      fieldErrors: validation.fieldErrors,
      formError: "Correct the highlighted fields.",
    };
  }

  const duplicates = await findDuplicates(
    supabase,
    validation.values.email,
    validation.values.phone,
    clientId,
  );
  const duplicateConfirmed =
    getFormString(formData, "confirmDuplicate") === "yes";

  if (duplicates.length > 0 && !duplicateConfirmed) {
    return {
      values: validation.values,
      fieldErrors: {},
      duplicateWarning:
        "Another client has a matching email address or phone number.",
      duplicates,
    };
  }

  const { data, error } = await supabase.rpc("update_client", {
    target_client_id: clientId,
    new_client_type: validation.values.clientType,
    new_display_name: validation.values.displayName,
    new_company_name: validation.values.companyName,
    new_contact_person: validation.values.contactPerson,
    new_email: validation.values.email,
    new_phone: validation.values.phone,
    new_alternative_phone: validation.values.alternativePhone,
    new_physical_address: validation.values.physicalAddress,
    new_billing_address: validation.values.billingAddress,
    new_tax_number: validation.values.taxNumber,
    new_notes: validation.values.notes,
    ...(validation.values.assignedTo
      ? { new_assigned_to: validation.values.assignedTo }
      : {}),
  });

  if (error || !data) {
    return {
      values: validation.values,
      fieldErrors: {},
      formError: safeDatabaseError(error?.message || ""),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  redirect(
    `/dashboard/clients/${clientId}?message=${encodeURIComponent(
      `${data.client_reference} was updated successfully.`,
    )}`,
  );
}

export async function setClientArchivedAction(formData: FormData) {
  const { supabase } = await requireRoles(["administrator"]);
  const clientId = getFormString(formData, "clientId");
  const shouldArchive = getFormString(formData, "operation") === "archive";
  const confirmed = getFormString(formData, "confirmed") === "yes";

  if (!clientId || !confirmed) {
    redirect(
      `/dashboard/clients/${encodeURIComponent(
        clientId,
      )}?error=Confirm+the+status+change+before+continuing.`,
    );
  }

  const { error } = await supabase.rpc("set_client_archived", {
    target_client_id: clientId,
    should_archive: shouldArchive,
  });

  if (error) {
    redirect(
      `/dashboard/clients/${clientId}?error=${encodeURIComponent(
        safeDatabaseError(error.message),
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  redirect(
    `/dashboard/clients/${clientId}?message=${encodeURIComponent(
      shouldArchive ? "Client archived." : "Client restored.",
    )}`,
  );
}
