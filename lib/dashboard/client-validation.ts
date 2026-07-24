import type { Enums } from "../supabase/database.types";

export type ClientType = Enums<"client_type">;
export type ClientStatus = Enums<"client_status">;

export type ClientFormValues = {
  clientType: ClientType;
  displayName: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternativePhone: string;
  physicalAddress: string;
  billingAddress: string;
  taxNumber: string;
  notes: string;
  assignedTo: string;
};

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

export type DuplicateClient = {
  clientReference: string;
  displayName: string;
};

export type ClientFormState = {
  values: ClientFormValues;
  fieldErrors: ClientFormErrors;
  formError?: string;
  duplicateWarning?: string;
  duplicates?: DuplicateClient[];
};

export const emptyClientValues: ClientFormValues = {
  clientType: "individual",
  displayName: "",
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  alternativePhone: "",
  physicalAddress: "",
  billingAddress: "",
  taxNumber: "",
  notes: "",
  assignedTo: "",
};

export function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function validateLength(
  value: string,
  label: string,
  max: number,
  errors: ClientFormErrors,
  field: keyof ClientFormValues,
) {
  if (value.length > max) {
    errors[field] = `${label} must be ${max} characters or fewer.`;
  }
}

export function validateClientForm(formData: FormData) {
  const rawType = getFormString(formData, "clientType");
  const values: ClientFormValues = {
    clientType: rawType === "company" ? "company" : "individual",
    displayName: getFormString(formData, "displayName"),
    companyName: getFormString(formData, "companyName"),
    contactPerson: getFormString(formData, "contactPerson"),
    email: getFormString(formData, "email").toLowerCase(),
    phone: getFormString(formData, "phone"),
    alternativePhone: getFormString(formData, "alternativePhone"),
    physicalAddress: getFormString(formData, "physicalAddress"),
    billingAddress: getFormString(formData, "billingAddress"),
    taxNumber: getFormString(formData, "taxNumber"),
    notes: getFormString(formData, "notes"),
    assignedTo: getFormString(formData, "assignedTo"),
  };
  const errors: ClientFormErrors = {};

  if (!values.displayName) {
    errors.displayName = "Enter the client or company display name.";
  }
  if (!values.phone) {
    errors.phone = "Enter a primary phone number.";
  }
  if (values.clientType === "company" && !values.companyName) {
    errors.companyName = "Enter the registered or trading company name.";
  }
  if (
    values.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
  ) {
    errors.email = "Enter a valid email address.";
  }
  if (
    values.assignedTo &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      values.assignedTo,
    )
  ) {
    errors.assignedTo = "Select a valid active staff profile.";
  }

  validateLength(values.displayName, "Display name", 160, errors, "displayName");
  validateLength(values.companyName, "Company name", 160, errors, "companyName");
  validateLength(values.contactPerson, "Contact person", 160, errors, "contactPerson");
  validateLength(values.email, "Email", 254, errors, "email");
  validateLength(values.phone, "Phone", 40, errors, "phone");
  validateLength(
    values.alternativePhone,
    "Alternative phone",
    40,
    errors,
    "alternativePhone",
  );
  validateLength(
    values.physicalAddress,
    "Physical address",
    500,
    errors,
    "physicalAddress",
  );
  validateLength(
    values.billingAddress,
    "Billing address",
    500,
    errors,
    "billingAddress",
  );
  validateLength(values.taxNumber, "Tax number", 100, errors, "taxNumber");
  validateLength(values.notes, "Notes", 5000, errors, "notes");

  return {
    values,
    fieldErrors: errors,
    valid: Object.keys(errors).length === 0,
  };
}

export type ClientFilters = {
  search: string;
  status?: ClientStatus;
  type?: ClientType;
  sort: "newest" | "oldest" | "name";
  page: number;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseClientFilters(
  params: Record<string, string | string[] | undefined>,
): ClientFilters {
  const rawStatus = firstValue(params.status);
  const rawType = firstValue(params.type);
  const rawSort = firstValue(params.sort);
  const rawPage = Number.parseInt(firstValue(params.page) || "1", 10);

  return {
    search: (firstValue(params.q) || "").trim().slice(0, 120),
    status:
      rawStatus === "active" || rawStatus === "archived"
        ? rawStatus
        : undefined,
    type:
      rawType === "individual" || rawType === "company"
        ? rawType
        : undefined,
    sort:
      rawSort === "oldest" || rawSort === "name" ? rawSort : "newest",
    page: Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1,
  };
}
