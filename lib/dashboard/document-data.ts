import type {
  DocumentFormValues,
  DocumentItemValues,
  DocumentKind,
  InvoiceItemRecord,
  InvoiceRecord,
  QuotationItemRecord,
  QuotationRecord,
} from "@/lib/dashboard/document-types";
import { createEmptyDocumentItem } from "@/lib/dashboard/document-validation";
import type { Tables } from "@/lib/supabase/database.types";

function harareDateParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Harare",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return value.year + "-" + value.month + "-" + value.day;
}

export function addCalendarDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days, 12));
  return value.toISOString().slice(0, 10);
}

export function createDocumentInitialValues(
  kind: DocumentKind,
  settings: Tables<"company_settings">,
): DocumentFormValues {
  const issueDate = harareDateParts();
  const days =
    kind === "quotation"
      ? settings.default_quote_validity_days
      : settings.default_invoice_due_days;

  return {
    clientId: "",
    subject: "",
    introduction: "",
    notes: "",
    termsConditions:
      kind === "quotation"
        ? settings.default_quote_terms
        : settings.default_invoice_terms,
    currency: settings.default_currency,
    issueDate,
    secondaryDate: addCalendarDays(issueDate, days),
    discountType: "none",
    discountValue: "0.0000",
    taxMode: settings.default_tax_mode,
    taxRate: Number(settings.default_tax_rate).toFixed(4),
    taxLabel: settings.default_tax_label,
    assignedTo: "",
    lockVersion: "",
    items: [createEmptyDocumentItem()],
  };
}

function quotationItemValues(item: QuotationItemRecord): DocumentItemValues {
  return {
    id: item.id,
    itemType: item.item_type,
    description: item.description,
    quantity: Number(item.quantity).toFixed(4),
    unit: item.unit,
    unitPrice: Number(item.unit_price).toFixed(4),
    discountType: item.discount_type,
    discountValue: Number(item.discount_value).toFixed(4),
    taxApplicable: item.tax_applicable,
  };
}

function invoiceItemValues(item: InvoiceItemRecord): DocumentItemValues {
  return {
    id: item.id,
    itemType: item.item_type,
    description: item.description,
    quantity: Number(item.quantity).toFixed(4),
    unit: item.unit,
    unitPrice: Number(item.unit_price).toFixed(4),
    discountType: item.discount_type,
    discountValue: Number(item.discount_value).toFixed(4),
    taxApplicable: item.tax_applicable,
  };
}

export function quotationFormValues(
  quotation: QuotationRecord,
  items: QuotationItemRecord[],
): DocumentFormValues {
  return {
    clientId: quotation.client_id,
    subject: quotation.subject,
    introduction: quotation.introduction || "",
    notes: quotation.notes || "",
    termsConditions: quotation.terms_conditions,
    currency: quotation.currency,
    issueDate: quotation.issue_date,
    secondaryDate: quotation.expiry_date,
    discountType: quotation.discount_type,
    discountValue: Number(quotation.discount_value).toFixed(4),
    taxMode: quotation.tax_mode,
    taxRate: Number(quotation.tax_rate).toFixed(4),
    taxLabel: quotation.tax_label,
    assignedTo: quotation.assigned_to || "",
    lockVersion: String(quotation.lock_version),
    items: items.map(quotationItemValues),
  };
}

export function invoiceFormValues(
  invoice: InvoiceRecord,
  items: InvoiceItemRecord[],
): DocumentFormValues {
  return {
    clientId: invoice.client_id,
    subject: invoice.subject,
    introduction: "",
    notes: invoice.notes || "",
    termsConditions: invoice.terms_conditions,
    currency: invoice.currency,
    issueDate: invoice.issue_date,
    secondaryDate: invoice.due_date,
    discountType: invoice.discount_type,
    discountValue: Number(invoice.discount_value).toFixed(4),
    taxMode: invoice.tax_mode,
    taxRate: Number(invoice.tax_rate).toFixed(4),
    taxLabel: invoice.tax_label,
    assignedTo: "",
    lockVersion: String(invoice.lock_version),
    items: items.map(invoiceItemValues),
  };
}
