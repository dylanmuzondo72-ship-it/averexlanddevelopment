import { notFound, redirect } from "next/navigation";
import { updateClientAction } from "@/app/dashboard/clients/actions";
import { ClientForm } from "@/components/dashboard/clients/ClientForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireRoles } from "@/lib/dashboard/access";
import type { ClientFormValues } from "@/lib/dashboard/client-validation";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, supabase } = await requireRoles(["administrator", "staff"]);
  const { data: clientRows, error } = await supabase.rpc("get_client_details", {
    target_client_id: id,
  });
  const client = clientRows?.[0];

  if (error || !client) {
    notFound();
  }

  if (profile.role === "staff" && client.status !== "active") {
    redirect(
      `/dashboard/clients/${id}?error=Staff+may+only+edit+active+clients.`,
    );
  }

  let assignableProfiles: { id: string; label: string }[] = [];
  if (profile.role === "administrator") {
    const { data } = await supabase.rpc("search_staff_profiles", {
      status_filter: "active",
      page_size: 100,
      page_offset: 0,
    });
    assignableProfiles = (data || []).map((item) => ({
      id: item.id,
      label: item.full_name || item.email,
    }));
  }

  const initialValues: ClientFormValues = {
    clientType: client.client_type,
    displayName: client.display_name,
    companyName: client.company_name || "",
    contactPerson: client.contact_person || "",
    email: client.email || "",
    phone: client.phone,
    alternativePhone: client.alternative_phone || "",
    physicalAddress: client.physical_address || "",
    billingAddress: client.billing_address || "",
    taxNumber: client.tax_number || "",
    notes: client.notes || "",
    assignedTo: client.assigned_to || "",
  };
  const action = updateClientAction.bind(null, client.id);

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow={client.client_reference}
        title={`Edit ${client.display_name}`}
        description="Update verified client details. Changes are recorded in the activity history."
      />
      <ClientForm
        action={action}
        initialValues={initialValues}
        role={profile.role}
        assignableProfiles={assignableProfiles}
        submitLabel="Save changes"
        cancelHref={`/dashboard/clients/${client.id}`}
      />
    </div>
  );
}
