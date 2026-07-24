import { notFound } from "next/navigation";
import { DocumentPreview } from "@/components/dashboard/documents/DocumentPreview";
import { PrintButton } from "@/components/dashboard/documents/PrintButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";

export default async function PrintQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireDashboardUser();
  const [{ data: quotation }, { data: items }] = await Promise.all([
    supabase.from("quotations").select("*").eq("id", id).maybeSingle(),
    supabase.from("quotation_items").select("*").eq("quotation_id", id).order("position"),
  ]);
  if (!quotation || !items) notFound();
  const { error } = await supabase.rpc("record_document_print", { document_kind: "quotation", target_document_id: id });
  if (error) notFound();
  return (
    <div className="dashboard-content document-print-page">
      <PageHeader eyebrow={quotation.quote_number} title="Printable quotation" description="Use your browser print dialog to print or save this A4 document." actions={<PrintButton />} />
      <DocumentPreview kind="quotation" document={quotation} items={items} />
    </div>
  );
}
