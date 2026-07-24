import { createQuotationAction } from "@/app/dashboard/quotes/actions";
import { DocumentForm } from "@/components/dashboard/documents/DocumentForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireRoles } from "@/lib/dashboard/access";
import { createDocumentInitialValues } from "@/lib/dashboard/document-data";
import type { DocumentAssigneeOption, DocumentClientOption } from "@/lib/dashboard/document-types";

export default async function NewQuotationPage() {
  const { profile, supabase } = await requireRoles(["administrator", "staff"]);
  const [{ data: settings }, { data: clientOptions }, { data: assigneeOptions }] = await Promise.all([
    supabase.from("company_settings").select("*").order("created_at").limit(1).maybeSingle(),
    supabase.rpc("list_document_clients", { document_kind: "quotation", result_limit: 200 }),
    profile.role === "administrator" ? supabase.rpc("list_document_assignees") : Promise.resolve({ data: [], error: null }),
  ]);
  if (!settings) {
    return <div className="dashboard-content"><PageHeader eyebrow="New quotation" title="Settings unavailable" /><section className="dashboard-empty-state" role="alert"><h2>Company defaults could not be loaded.</h2><p>Configure company settings before creating a quotation.</p></section></div>;
  }
  return (
    <div className="dashboard-content">
      <PageHeader eyebrow="New quotation" title="Create quotation" description="Save the first draft to assign a permanent quotation number." />
      <DocumentForm kind="quotation" action={createQuotationAction} initialValues={createDocumentInitialValues("quotation", settings)} clients={(clientOptions || []) as DocumentClientOption[]} assignees={(assigneeOptions || []) as DocumentAssigneeOption[]} mayAssign={profile.role === "administrator"} submitLabel="Save draft quotation" />
    </div>
  );
}
