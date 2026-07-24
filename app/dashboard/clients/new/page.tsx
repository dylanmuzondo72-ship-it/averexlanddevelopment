import { createClientAction } from "@/app/dashboard/clients/actions";
import { ClientForm } from "@/components/dashboard/clients/ClientForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireRoles } from "@/lib/dashboard/access";
import { emptyClientValues } from "@/lib/dashboard/client-validation";

export default async function NewClientPage() {
  const { profile, supabase } = await requireRoles(["administrator", "staff"]);
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

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow="Client management"
        title="Add client"
        description="Create a verified client record. A unique Averex client reference will be generated automatically."
      />
      <ClientForm
        action={createClientAction}
        initialValues={emptyClientValues}
        role={profile.role}
        assignableProfiles={assignableProfiles}
        submitLabel="Create client"
        cancelHref="/dashboard/clients"
      />
    </div>
  );
}
