import {
  appRoles,
  profileStatuses,
  type AppRole,
  type ProfileStatus,
} from "./permissions";

export type StaffFormState = {
  formError?: string;
  message?: string;
};

export function validateStaffUpdate(formData: FormData) {
  const targetProfileId = String(formData.get("targetProfileId") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "") as AppRole;
  const status = String(formData.get("status") || "") as ProfileStatus;
  const confirmed = formData.get("confirmed") === "yes";
  const errors: string[] = [];

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      targetProfileId,
    )
  ) {
    errors.push("The staff profile identifier is invalid.");
  }
  if (!fullName) errors.push("Enter the staff member's full name.");
  if (fullName.length > 160) errors.push("Full name is too long.");
  if (phone.length > 40) errors.push("Phone number is too long.");
  if (!appRoles.includes(role)) errors.push("Select a valid role.");
  if (!profileStatuses.includes(status)) errors.push("Select a valid status.");
  if (!confirmed) errors.push("Confirm the profile and permission changes.");

  return {
    valid: errors.length === 0,
    error: errors[0],
    values: { targetProfileId, fullName, phone, role, status },
  };
}

export type StaffFilters = {
  search: string;
  role?: AppRole;
  status?: ProfileStatus;
  page: number;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStaffFilters(
  params: Record<string, string | string[] | undefined>,
): StaffFilters {
  const role = firstValue(params.role) as AppRole | undefined;
  const status = firstValue(params.status) as ProfileStatus | undefined;
  const page = Number.parseInt(firstValue(params.page) || "1", 10);

  return {
    search: (firstValue(params.q) || "").trim().slice(0, 120),
    role: role && appRoles.includes(role) ? role : undefined,
    status:
      status && profileStatuses.includes(status) ? status : undefined,
    page: Number.isFinite(page) ? Math.max(1, page) : 1,
  };
}
