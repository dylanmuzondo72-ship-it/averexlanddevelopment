import { notFound } from "next/navigation";
import { updateInvoiceAction } from "@/app/dashboard/invoices/actions";
import { DocumentForm } from "@/components/dashboard/documents/DocumentForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireRoles } from "@/lib/dashboard/access";
import { invoiceFormValues } from "@/lib/dashboard/document-data";
import type { DocumentClientOption } from "@/lib/dashboard/document-types";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const [{ data: invoice }, { data: items }, { data: clients }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
    supabase.from("invoice_items").select("*").eq("invoice_id", id).order("position"),
    supabase.rpc("list_document_clients", { document_kind: "invoice", result_limit: 200 }),
  ]);
  if (!invoice || !items || invoice.status !== "draft") notFound();
  return (
    <div className="dashboard-content">
      <PageHeader eyebrow={invoice.invoice_number || "Draft invoice"} title="Edit invoice" description="Draft updates require the version loaded on this page." />
      <DocumentForm kind="invoice" action={updateInvoiceAction.bind(null, invoice.id)} initialValues={invoiceFormValues(invoice, items)} clients={(clients || []) as DocumentClientOption[]} submitLabel="Save invoice changes" />
    </div>
  );
}
