import type {
  DiscountType,
  DocumentFormState,
  DocumentFormValues,
  DocumentItemType,
  DocumentItemValues,
  DocumentKind,
  TaxMode,
} from "@/lib/dashboard/document-types";
import type { Json } from "@/lib/supabase/database.types";

const decimalPattern = /^\d+(?:\.\d{1,4})?$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const discountTypes: DiscountType[] = ["none", "percentage", "fixed"];
const taxModes: TaxMode[] = ["exclusive", "inclusive"];
const itemTypes: DocumentItemType[] = ["service", "product", "fee", "other"];

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function decimalIsValid(
  value: string,
  options: { positive?: boolean; maximum?: number } = {},
) {
  if (!decimalPattern.test(value)) return false;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return false;
  if (options.positive ? parsed <= 0 : parsed < 0) return false;
  return options.maximum === undefined || parsed <= options.maximum;
}

function parseItems(value: string): DocumentItemValues[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const candidate = item as Record<string, unknown>;
      const itemType = itemTypes.includes(
        candidate.itemType as DocumentItemType,
      )
        ? (candidate.itemType as DocumentItemType)
        : "service";
      const discountType = discountTypes.includes(
        candidate.discountType as DiscountType,
      )
        ? (candidate.discountType as DiscountType)
        : "none";

      return [
        {
          id:
            typeof candidate.id === "string" && candidate.id
              ? candidate.id
              : `item-${index + 1}`,
          itemType,
          description:
            typeof candidate.description === "string"
              ? candidate.description.trim()
              : "",
          quantity:
            typeof candidate.quantity === "string"
              ? candidate.quantity.trim()
              : "",
          unit:
            typeof candidate.unit === "string"
              ? candidate.unit.trim()
              : "",
          unitPrice:
            typeof candidate.unitPrice === "string"
              ? candidate.unitPrice.trim()
              : "",
          discountType,
          discountValue:
            typeof candidate.discountValue === "string"
              ? candidate.discountValue.trim()
              : "0",
          taxApplicable: candidate.taxApplicable !== false,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function createEmptyDocumentItem(index = 1): DocumentItemValues {
  return {
    id: `item-${index}`,
    itemType: "service",
    description: "",
    quantity: "1.0000",
    unit: "service",
    unitPrice: "0.0000",
    discountType: "none",
    discountValue: "0.0000",
    taxApplicable: true,
  };
}

export function validateDocumentForm(
  formData: FormData,
  kind: DocumentKind,
) {
  const parsedItems = parseItems(stringValue(formData, "itemsJson"));
  const rawDiscountType = stringValue(formData, "discountType");
  const rawTaxMode = stringValue(formData, "taxMode");
  const values: DocumentFormValues = {
    clientId: stringValue(formData, "clientId"),
    subject: stringValue(formData, "subject"),
    introduction: stringValue(formData, "introduction"),
    notes: stringValue(formData, "notes"),
    termsConditions: stringValue(formData, "termsConditions"),
    currency: stringValue(formData, "currency").toUpperCase(),
    issueDate: stringValue(formData, "issueDate"),
    secondaryDate: stringValue(formData, "secondaryDate"),
    discountType: discountTypes.includes(rawDiscountType as DiscountType)
      ? (rawDiscountType as DiscountType)
      : "none",
    discountValue: stringValue(formData, "discountValue") || "0",
    taxMode: taxModes.includes(rawTaxMode as TaxMode)
      ? (rawTaxMode as TaxMode)
      : "exclusive",
    taxRate: stringValue(formData, "taxRate") || "0",
    taxLabel: stringValue(formData, "taxLabel"),
    assignedTo: stringValue(formData, "assignedTo"),
    lockVersion: stringValue(formData, "lockVersion"),
    items: parsedItems,
  };
  const fieldErrors: DocumentFormState["fieldErrors"] = {};

  if (!uuidPattern.test(values.clientId)) {
    fieldErrors.clientId = "Select an active client.";
  }
  if (values.subject.length < 2 || values.subject.length > 200) {
    fieldErrors.subject = "Enter a subject from 2 to 200 characters.";
  }
  if (!/^[A-Z]{3}$/.test(values.currency)) {
    fieldErrors.currency = "Use a three-letter currency code.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.issueDate)) {
    fieldErrors.issueDate = "Choose a valid issue date.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.secondaryDate)) {
    fieldErrors.secondaryDate = `Choose a valid ${
      kind === "quotation" ? "expiry" : "due"
    } date.`;
  }
  if (
    values.issueDate &&
    values.secondaryDate &&
    values.secondaryDate < values.issueDate
  ) {
    fieldErrors.secondaryDate = `The ${
      kind === "quotation" ? "expiry" : "due"
    } date cannot precede the issue date.`;
  }
  if (
    !decimalIsValid(values.discountValue, {
      maximum: values.discountType === "percentage" ? 100 : undefined,
    })
  ) {
    fieldErrors.discountValue =
      values.discountType === "percentage"
        ? "Enter a document discount from 0 to 100%."
        : "Enter a non-negative document discount.";
  }
  if (!decimalIsValid(values.taxRate)) {
    fieldErrors.taxRate = "Enter a non-negative tax rate.";
  }
  if (!values.taxLabel || values.taxLabel.length > 40) {
    fieldErrors.taxLabel = "Enter a tax label up to 40 characters.";
  }
  if (values.assignedTo && !uuidPattern.test(values.assignedTo)) {
    fieldErrors.assignedTo = "Select a valid staff profile.";
  }
  if (
    values.lockVersion &&
    (!/^\d+$/.test(values.lockVersion) || Number(values.lockVersion) < 1)
  ) {
    fieldErrors.lockVersion = "The record version is invalid. Refresh the page.";
  }

  if (values.items.length === 0) {
    fieldErrors.items = "Add at least one line item.";
  } else {
    const invalidItem = values.items.find((item) => {
      if (!item.description || item.description.length > 2000) return true;
      if (!item.unit || item.unit.length > 40) return true;
      if (!decimalIsValid(item.quantity, { positive: true })) return true;
      if (!decimalIsValid(item.unitPrice)) return true;
      return !decimalIsValid(item.discountValue, {
        maximum: item.discountType === "percentage" ? 100 : undefined,
      });
    });
    if (invalidItem) {
      fieldErrors.items =
        "Complete every item with a description, positive quantity, unit, price and valid discount.";
    }
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    values,
    fieldErrors,
    parsed: {
      discountValue: Number(values.discountValue),
      taxRate: Number(values.taxRate),
      lockVersion: values.lockVersion ? Number(values.lockVersion) : undefined,
      items: values.items.map(
        (item): Json => ({
          item_type: item.itemType,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          discount_type: item.discountType,
          discount_value: item.discountValue,
          tax_applicable: item.taxApplicable,
        }),
      ),
    },
  };
}
