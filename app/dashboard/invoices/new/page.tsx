import { createInvoiceAction } from "@/app/dashboard/invoices/actions";
import { DocumentForm } from "@/components/dashboard/documents/DocumentForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireRoles } from "@/lib/dashboard/access";
import { createDocumentInitialValues } from "@/lib/dashboard/document-data";
import type { DocumentClientOption } from "@/lib/dashboard/document-types";

export default async function NewInvoicePage() {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const [{ data: settings }, { data: clients }] = await Promise.all([
    supabase.from("company_settings").select("*").order("created_at").limit(1).maybeSingle(),
    supabase.rpc("list_document_clients", { document_kind: "invoice", result_limit: 200 }),
  ]);
  if (!settings) {
    return <div className="dashboard-content"><PageHeader eyebrow="New invoice" title="Settings unavailable" /><section className="dashboard-empty-state" role="alert"><h2>Company defaults could not be loaded.</h2><p>Configure company settings before creating an invoice.</p></section></div>;
  }
  return (
    <div className="dashboard-content">
      <PageHeader eyebrow="New invoice" title="Create invoice" description="Direct invoices are available to administrators and accountants. Staff can read permitted invoices but cannot create them." />
      <DocumentForm kind="invoice" action={createInvoiceAction} initialValues={createDocumentInitialValues("invoice", settings)} clients={(clients || []) as DocumentClientOption[]} submitLabel="Save draft invoice" />
    </div>
  );
}
