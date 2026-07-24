import type { Json } from "../supabase/database.types";

export type SettingsFormValues = {
  companyName: string;
  slogan: string;
  ceoName: string;
  address: string;
  primaryPhone: string;
  alternativePhone: string;
  primaryEmail: string;
  alternativeEmail: string;
  defaultCurrency: string;
  defaultTaxRate: string;
  defaultQuoteTerms: string;
  defaultInvoiceTerms: string;
  quotePrefix: string;
  invoicePrefix: string;
  receiptPrefix: string;
  landListingPrefix: string;
  clientPrefix: string;
  googleMapsQuery: string;
  googleMapsEmbedUrl: string;
  socialLinks: string;
  taxDetails: string;
  bankingDetails: string;
  ecocashDetails: string;
  logoPath: string;
};

export type SettingsFormState = {
  values: SettingsFormValues;
  fieldErrors: Partial<Record<keyof SettingsFormValues, string>>;
  formError?: string;
  message?: string;
};

function getString(formData: FormData, name: keyof SettingsFormValues) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseJsonObject(value: string) {
  try {
    const parsed: unknown = value ? JSON.parse(value) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "Enter a JSON object using key and value pairs." };
    }
    return { value: parsed as Json };
  } catch {
    return { error: "Enter valid JSON using double-quoted keys and values." };
  }
}

export function validateSettingsForm(formData: FormData) {
  const values: SettingsFormValues = {
    companyName: getString(formData, "companyName"),
    slogan: getString(formData, "slogan"),
    ceoName: getString(formData, "ceoName"),
    address: getString(formData, "address"),
    primaryPhone: getString(formData, "primaryPhone"),
    alternativePhone: getString(formData, "alternativePhone"),
    primaryEmail: getString(formData, "primaryEmail").toLowerCase(),
    alternativeEmail: getString(formData, "alternativeEmail").toLowerCase(),
    defaultCurrency: getString(formData, "defaultCurrency").toUpperCase(),
    defaultTaxRate: getString(formData, "defaultTaxRate"),
    defaultQuoteTerms: getString(formData, "defaultQuoteTerms"),
    defaultInvoiceTerms: getString(formData, "defaultInvoiceTerms"),
    quotePrefix: getString(formData, "quotePrefix").toUpperCase(),
    invoicePrefix: getString(formData, "invoicePrefix").toUpperCase(),
    receiptPrefix: getString(formData, "receiptPrefix").toUpperCase(),
    landListingPrefix: getString(formData, "landListingPrefix").toUpperCase(),
    clientPrefix: getString(formData, "clientPrefix").toUpperCase(),
    googleMapsQuery: getString(formData, "googleMapsQuery"),
    googleMapsEmbedUrl: getString(formData, "googleMapsEmbedUrl"),
    socialLinks: getString(formData, "socialLinks"),
    taxDetails: getString(formData, "taxDetails"),
    bankingDetails: getString(formData, "bankingDetails"),
    ecocashDetails: getString(formData, "ecocashDetails"),
    logoPath: getString(formData, "logoPath"),
  };
  const fieldErrors: SettingsFormState["fieldErrors"] = {};
  const required: (keyof SettingsFormValues)[] = [
    "companyName",
    "slogan",
    "ceoName",
    "address",
    "primaryPhone",
    "primaryEmail",
    "defaultCurrency",
    "quotePrefix",
    "invoicePrefix",
    "receiptPrefix",
    "landListingPrefix",
    "clientPrefix",
  ];

  for (const field of required) {
    if (!values[field]) fieldErrors[field] = "This field is required.";
  }

  if (values.primaryEmail && !isEmail(values.primaryEmail)) {
    fieldErrors.primaryEmail = "Enter a valid primary email address.";
  }
  if (values.alternativeEmail && !isEmail(values.alternativeEmail)) {
    fieldErrors.alternativeEmail = "Enter a valid alternative email address.";
  }
  if (!isHttpUrl(values.googleMapsEmbedUrl)) {
    fieldErrors.googleMapsEmbedUrl = "Enter a valid HTTP or HTTPS URL.";
  }
  if (values.logoPath && !values.logoPath.startsWith("/")) {
    fieldErrors.logoPath = "Use a root-relative public asset path.";
  }
  if (!/^[A-Z]{3}$/.test(values.defaultCurrency)) {
    fieldErrors.defaultCurrency = "Use a three-letter currency code.";
  }

  const taxRate = Number(values.defaultTaxRate);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    fieldErrors.defaultTaxRate = "Enter a tax rate from 0 to 100.";
  }

  const prefixPattern = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
  const prefixFields: (keyof SettingsFormValues)[] = [
    "quotePrefix",
    "invoicePrefix",
    "receiptPrefix",
    "landListingPrefix",
    "clientPrefix",
  ];
  for (const field of prefixFields) {
    if (values[field] && !prefixPattern.test(values[field])) {
      fieldErrors[field] =
        "Use uppercase letters, numbers and single hyphen separators.";
    }
  }

  const socialLinks = parseJsonObject(values.socialLinks);
  const taxDetails = parseJsonObject(values.taxDetails);
  const bankingDetails = parseJsonObject(values.bankingDetails);
  const ecocashDetails = parseJsonObject(values.ecocashDetails);

  if (socialLinks.error) fieldErrors.socialLinks = socialLinks.error;
  if (taxDetails.error) fieldErrors.taxDetails = taxDetails.error;
  if (bankingDetails.error) fieldErrors.bankingDetails = bankingDetails.error;
  if (ecocashDetails.error) fieldErrors.ecocashDetails = ecocashDetails.error;

  if (socialLinks.value && typeof socialLinks.value === "object") {
    for (const value of Object.values(socialLinks.value)) {
      if (typeof value === "string" && value && !isHttpUrl(value)) {
        fieldErrors.socialLinks =
          "Every social-link value must be a valid HTTP or HTTPS URL.";
        break;
      }
    }
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    values,
    fieldErrors,
    parsed: {
      socialLinks: socialLinks.value || {},
      taxDetails: taxDetails.value || {},
      bankingDetails: bankingDetails.value || {},
      ecocashDetails: ecocashDetails.value || {},
      taxRate,
    },
  };
}
