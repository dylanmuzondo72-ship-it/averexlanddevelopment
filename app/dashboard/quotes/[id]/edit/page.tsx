import { notFound } from "next/navigation";
import { updateQuotationAction } from "@/app/dashboard/quotes/actions";
import { DocumentForm } from "@/components/dashboard/documents/DocumentForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireRoles } from "@/lib/dashboard/access";
import { quotationFormValues } from "@/lib/dashboard/document-data";
import type { DocumentAssigneeOption, DocumentClientOption } from "@/lib/dashboard/document-types";

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase } = await requireRoles(["administrator", "staff"]);
  const [{ data: quotation }, { data: items }, { data: settings }, { data: clients }, { data: assignees }] = await Promise.all([
    supabase.from("quotations").select("*").eq("id", id).maybeSingle(),
    supabase.from("quotation_items").select("*").eq("quotation_id", id).order("position"),
    supabase.from("company_settings").select("*").order("created_at").limit(1).maybeSingle(),
    supabase.rpc("list_document_clients", { document_kind: "quotation", result_limit: 200 }),
    profile.role === "administrator" ? supabase.rpc("list_document_assignees") : Promise.resolve({ data: [], error: null }),
  ]);
  if (!quotation || !items || !settings || quotation.status !== "draft") notFound();
  return (
    <div className="dashboard-content">
      <PageHeader eyebrow={quotation.quote_number} title="Edit quotation" description="Draft updates require the version loaded on this page." />
      <DocumentForm kind="quotation" action={updateQuotationAction.bind(null, quotation.id)} initialValues={quotationFormValues(quotation, items)} clients={(clients || []) as DocumentClientOption[]} assignees={(assignees || []) as DocumentAssigneeOption[]} mayAssign={profile.role === "administrator"} submitLabel="Save quotation changes" />
    </div>
  );
}
