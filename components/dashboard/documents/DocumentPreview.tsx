import Image from "next/image";
import { formatMoney } from "@/lib/dashboard/document-format";
import {
  isSnapshotRecord,
  snapshotText,
  type InvoiceRecord,
  type QuotationRecord,
} from "@/lib/dashboard/document-types";
import { formatDate, titleCase } from "@/lib/dashboard/format";
import type { Json } from "@/lib/supabase/database.types";

type PreviewItem = {
  id: string;
  position: number;
  item_type: "service" | "product" | "fee" | "other";
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
  tax_applicable: boolean;
};

type PreviewProps =
  | {
      kind: "quotation";
      document: QuotationRecord;
      items: PreviewItem[];
  }
  | {
      kind: "invoice";
      document: InvoiceRecord;
      items: PreviewItem[];
  };

function snapshotEntries(value: Json, key: string) {
  if (!isSnapshotRecord(value)) return [];
  const nested = value[key];
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return [];

  return Object.entries(nested).flatMap(([label, entry]) => {
    if (
      typeof entry !== "string" &&
      typeof entry !== "number" &&
      typeof entry !== "boolean"
    ) {
      return [];
    }
    return [[titleCase(label), String(entry)] as const];
  });
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}

export function DocumentPreview(props: PreviewProps) {
  const { kind, document, items } = props;
  const pages = chunkItems(items, 8);
  const company = document.company_snapshot;
  const client = document.client_snapshot;
  const logoPath =
    snapshotText(company, "logo_path") || "/assets/images/averex-logo.png";
  const documentNumber =
    kind === "quotation"
      ? document.quote_number
      : document.invoice_number || "DRAFT INVOICE";
  const secondaryDate =
    kind === "quotation" ? document.expiry_date : document.due_date;
  const paymentDetails =
    kind === "invoice"
      ? [
          ...snapshotEntries(company, "banking_details"),
          ...snapshotEntries(company, "ecocash_details"),
        ]
      : [];

  return (
    <div className="document-preview" aria-label={`${kind} document preview`}>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <article className="document-sheet" key={`page-${pageIndex + 1}`}>
            <header className="document-header">
              <div className="document-logo">
                <Image
                  src={logoPath}
                  alt={snapshotText(company, "company_name")}
                  width={565}
                  height={205}
                />
              </div>
              <div className="document-identity">
                <p>{snapshotText(company, "address")}</p>
                <p>
                  {[
                    snapshotText(company, "primary_phone"),
                    snapshotText(company, "alternative_phone"),
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
                <p>
                  {[
                    snapshotText(company, "primary_email"),
                    snapshotText(company, "alternative_email"),
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              </div>
            </header>

            <div className="document-title-row">
              <div>
                <span>{kind === "quotation" ? "Quotation" : "Invoice"}</span>
                <strong>{documentNumber}</strong>
              </div>
              <dl>
                <div>
                  <dt>Issue date</dt>
                  <dd>{formatDate(document.issue_date)}</dd>
                </div>
                <div>
                  <dt>{kind === "quotation" ? "Expiry date" : "Due date"}</dt>
                  <dd>{formatDate(secondaryDate)}</dd>
                </div>
                <div>
                  <dt>Currency</dt>
                  <dd>{document.currency}</dd>
                </div>
              </dl>
            </div>

            <section className="document-client-block">
              <p>Prepared for</p>
              <h2>{snapshotText(client, "display_name")}</h2>
              {snapshotText(client, "company_name") && (
                <strong>{snapshotText(client, "company_name")}</strong>
              )}
              <span>{snapshotText(client, "contact_person")}</span>
              <span>{snapshotText(client, "physical_address")}</span>
              <span>{snapshotText(client, "phone")}</span>
              <span>{snapshotText(client, "email")}</span>
              {snapshotText(client, "tax_number") && (
                <span>Tax number: {snapshotText(client, "tax_number")}</span>
              )}
            </section>

            <section className="document-subject">
              <p>Subject</p>
              <h2>{document.subject}</h2>
              {kind === "quotation" && document.introduction && (
                <p>{document.introduction}</p>
              )}
            </section>

            <div className="document-table-wrap">
              <table className="document-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Unit price</th>
                    <th>Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.position}</td>
                      <td>
                        <strong>{item.description}</strong>
                        <span>
                          {titleCase(item.item_type)}
                          {!item.tax_applicable ? " / No tax" : ""}
                        </span>
                      </td>
                      <td>{Number(item.quantity).toFixed(4)}</td>
                      <td>{item.unit}</td>
                      <td>{formatMoney(item.unit_price, document.currency)}</td>
                      <td>{formatMoney(item.line_total, document.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isLastPage && (
              <>
                <div className="document-totals">
                  <dl>
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{formatMoney(document.subtotal, document.currency)}</dd>
                    </div>
                    <div>
                      <dt>Discount</dt>
                      <dd>
                        {formatMoney(document.discount_total, document.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        {document.tax_label} ({Number(document.tax_rate)}%)
                      </dt>
                      <dd>
                        {formatMoney(document.tax_total, document.currency)}
                      </dd>
                    </div>
                    <div className="document-grand-total">
                      <dt>Total</dt>
                      <dd>
                        {formatMoney(document.grand_total, document.currency)}
                      </dd>
                    </div>
                    {kind === "invoice" && (
                      <>
                        <div>
                          <dt>Amount paid</dt>
                          <dd>
                            {formatMoney(document.amount_paid, document.currency)}
                          </dd>
                        </div>
                        <div className="document-balance-total">
                          <dt>Balance due</dt>
                          <dd>
                            {formatMoney(document.balance_due, document.currency)}
                          </dd>
                        </div>
                      </>
                    )}
                  </dl>
                  <p>
                    Prices are tax {document.tax_mode}. Totals are rounded to
                    two decimal places.
                  </p>
                </div>

                {kind === "invoice" && paymentDetails.length > 0 && (
                  <section className="document-terms">
                    <h3>Payment instructions</h3>
                    <dl>
                      {paymentDetails.map(([label, value], index) => (
                        <div key={`${label}-${index}`}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}

                <section className="document-terms">
                  <h3>Terms and conditions</h3>
                  <p>
                    {document.terms_conditions ||
                      "No additional terms were recorded."}
                  </p>
                </section>

                {document.notes && (
                  <section className="document-terms">
                    <h3>Notes</h3>
                    <p>{document.notes}</p>
                  </section>
                )}

                <div className="document-signatures">
                  <div>
                    <span>Prepared by</span>
                  </div>
                  <div>
                    <span>Authorised signature</span>
                  </div>
                </div>
              </>
            )}

            <footer className="document-footer">
              <span>{snapshotText(company, "slogan")}</span>
              <span>
                Page {pageIndex + 1} of {pages.length}
              </span>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
