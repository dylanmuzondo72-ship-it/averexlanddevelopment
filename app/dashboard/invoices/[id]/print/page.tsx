import { notFound } from "next/navigation";
import { DocumentPreview } from "@/components/dashboard/documents/DocumentPreview";
import { PrintButton } from "@/components/dashboard/documents/PrintButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireDashboardUser();
  const [{ data: invoice }, { data: items }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
    supabase.from("invoice_items").select("*").eq("invoice_id", id).order("position"),
  ]);
  if (!invoice || !items) notFound();
  const { error } = await supabase.rpc("record_document_print", { document_kind: "invoice", target_document_id: id });
  if (error) notFound();
  return (
    <div className="dashboard-content document-print-page">
      <PageHeader eyebrow={invoice.invoice_number || "Draft invoice"} title="Printable invoice" description="Use your browser print dialog to print or save this A4 document." actions={<PrintButton />} />
      <DocumentPreview kind="invoice" document={invoice} items={items} />
    </div>
  );
}
