import type { Enums, Json, Tables } from "@/lib/supabase/database.types";

export type DiscountType = Enums<"discount_type">;
export type TaxMode = Enums<"document_tax_mode">;
export type DocumentItemType = Enums<"document_item_type">;
export type QuotationStatus = Enums<"quotation_status">;
export type InvoiceStatus = Enums<"invoice_status">;

export type DocumentKind = "quotation" | "invoice";

export type DocumentItemValues = {
  id: string;
  itemType: DocumentItemType;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountType: DiscountType;
  discountValue: string;
  taxApplicable: boolean;
};

export type DocumentFormValues = {
  clientId: string;
  subject: string;
  introduction: string;
  notes: string;
  termsConditions: string;
  currency: string;
  issueDate: string;
  secondaryDate: string;
  discountType: DiscountType;
  discountValue: string;
  taxMode: TaxMode;
  taxRate: string;
  taxLabel: string;
  assignedTo: string;
  lockVersion: string;
  items: DocumentItemValues[];
};

export type DocumentFieldName =
  | Exclude<keyof DocumentFormValues, "items">
  | "items";

export type DocumentFormState = {
  values: DocumentFormValues;
  fieldErrors: Partial<Record<DocumentFieldName, string>>;
  formError?: string;
};

export type DocumentClientOption = {
  id: string;
  client_reference: string;
  display_name: string;
  company_name: string | null;
  phone: string;
  email: string | null;
};

export type DocumentAssigneeOption = {
  id: string;
  display_name: string;
  role: "administrator" | "staff";
};

export type QuotationRecord = Tables<"quotations">;
export type QuotationItemRecord = Tables<"quotation_items">;
export type InvoiceRecord = Tables<"invoices">;
export type InvoiceItemRecord = Tables<"invoice_items">;

export type SnapshotRecord = Record<string, Json | undefined>;

export function isSnapshotRecord(value: Json): value is SnapshotRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function snapshotText(value: Json, key: string) {
  if (!isSnapshotRecord(value)) return "";
  const field = value[key];
  return typeof field === "string" ? field : "";
}
