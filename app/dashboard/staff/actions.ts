"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/lib/dashboard/access";
import type { StaffFormState } from "@/lib/dashboard/staff-validation";
import { validateStaffUpdate } from "@/lib/dashboard/staff-validation";

function safeProfileError(message: string) {
  if (message.includes("cannot deactivate your current account")) {
    return "You cannot deactivate the account you are currently using.";
  }
  if (message.includes("final active administrator")) {
    return "The final active administrator cannot be demoted or deactivated.";
  }
  if (message.includes("not found")) {
    return "The staff profile could not be found.";
  }
  if (message.includes("permission")) {
    return "You do not have permission to update staff profiles.";
  }
  return "The staff profile could not be updated. Try again.";
}

export async function updateStaffProfileAction(
  _previousState: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const { supabase } = await requireRoles(["administrator"]);
  const validation = validateStaffUpdate(formData);

  if (!validation.valid) {
    return { formError: validation.error };
  }

  const { data, error } = await supabase.rpc("admin_update_profile", {
    target_profile_id: validation.values.targetProfileId,
    new_full_name: validation.values.fullName,
    new_phone: validation.values.phone,
    new_role: validation.values.role,
    new_status: validation.values.status,
  });

  if (error || !data) {
    return { formError: safeProfileError(error?.message || "") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/staff");
  return {
    message: `${data.full_name || data.email} was updated successfully.`,
  };
}
