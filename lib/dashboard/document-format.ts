import type {
  DiscountType,
  DocumentItemValues,
  TaxMode,
} from "@/lib/dashboard/document-types";

const currencyFormatters = new Map<string, Intl.NumberFormat>();
const zero = BigInt(0);
const hundredCentsScale = BigInt(1000000);

export function formatMoney(value: number, currency: string) {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  let formatter = currencyFormatters.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-ZW", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(code, formatter);
  }
  return formatter.format(value);
}

function decimalToUnits(value: string, scale: number) {
  const cleaned = /^\d+(?:\.\d+)?$/.test(value) ? value : "0";
  const [whole, fraction = ""] = cleaned.split(".");
  return (
    BigInt(whole || "0") * BigInt(10 ** scale) +
    BigInt(fraction.slice(0, scale).padEnd(scale, "0"))
  );
}

function roundDivision(numerator: bigint, denominator: bigint) {
  return (numerator + denominator / BigInt(2)) / denominator;
}

function lineNetCents(item: DocumentItemValues) {
  const quantity = decimalToUnits(item.quantity, 4);
  const unitPrice = decimalToUnits(item.unitPrice, 4);
  const rawEighths = quantity * unitPrice;
  let discountEighths = zero;

  if (item.discountType === "percentage") {
    const rate = decimalToUnits(item.discountValue, 4);
    discountEighths = roundDivision(rawEighths * rate, hundredCentsScale);
  } else if (item.discountType === "fixed") {
    discountEighths =
      decimalToUnits(item.discountValue, 4) * BigInt(10000);
  }

  return roundDivision(
    rawEighths > discountEighths ? rawEighths - discountEighths : zero,
    hundredCentsScale,
  );
}

export function calculatePreviewTotals({
  items,
  discountType,
  discountValue,
  taxMode,
  taxRate,
}: {
  items: DocumentItemValues[];
  discountType: DiscountType;
  discountValue: string;
  taxMode: TaxMode;
  taxRate: string;
}) {
  const lines = items.map((item) => ({
    cents: lineNetCents(item),
    taxable: item.taxApplicable,
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.cents, zero);
  const taxableBefore = lines
    .filter((line) => line.taxable)
    .reduce((sum, line) => sum + line.cents, zero);
  const nonTaxableBefore = subtotal - taxableBefore;
  let discount = zero;

  if (discountType === "percentage") {
    discount = roundDivision(
      subtotal * decimalToUnits(discountValue, 4),
      hundredCentsScale,
    );
  } else if (discountType === "fixed") {
    discount = decimalToUnits(discountValue, 2);
  }
  if (discount > subtotal) discount = subtotal;

  let taxableDiscount = zero;
  if (subtotal > zero) {
    taxableDiscount = roundDivision(discount * taxableBefore, subtotal);
    const minimumTaxable =
      discount > nonTaxableBefore ? discount - nonTaxableBefore : zero;
    if (taxableDiscount < minimumTaxable) taxableDiscount = minimumTaxable;
    if (taxableDiscount > taxableBefore) taxableDiscount = taxableBefore;
  }
  const taxableSubtotal = taxableBefore - taxableDiscount;
  const rate = decimalToUnits(taxRate, 4);
  const tax =
    rate === zero
      ? zero
      : taxMode === "exclusive"
        ? roundDivision(taxableSubtotal * rate, hundredCentsScale)
        : roundDivision(taxableSubtotal * rate, hundredCentsScale + rate);
  const net = subtotal - discount;
  const grandTotal = taxMode === "exclusive" ? net + tax : net;

  return {
    lineTotals: lines.map((line) => Number(line.cents) / 100),
    subtotal: Number(subtotal) / 100,
    discount: Number(discount) / 100,
    taxableSubtotal: Number(taxableSubtotal) / 100,
    tax: Number(tax) / 100,
    grandTotal: Number(grandTotal) / 100,
  };
}
