import Link from "next/link";
import { Notice } from "@/components/dashboard/Notice";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { formatDateTime, titleCase } from "@/lib/dashboard/format";
import { canCreateClients } from "@/lib/dashboard/permissions";
import type { Json } from "@/lib/supabase/database.types";

type RecentActivity = {
  id: string;
  action: string;
  resource_type: string;
  summary: string;
  created_at: string;
};

type DashboardOverview = {
  activeClients: number;
  archivedClients: number;
  activeStaffProfiles: number;
  clientsCreatedThisMonth: number;
  recentActivity: RecentActivity[];
};

function numberFromJson(value: Json | undefined) {
  return typeof value === "number" ? value : 0;
}

function parseRecentActivity(value: Json | undefined): RecentActivity[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const id = item.id;
    const action = item.action;
    const resourceType = item.resource_type;
    const summary = item.summary;
    const createdAt = item.created_at;

    if (
      typeof id !== "string" ||
      typeof action !== "string" ||
      typeof resourceType !== "string" ||
      typeof summary !== "string" ||
      typeof createdAt !== "string"
    ) {
      return [];
    }

    return [
      {
        id,
        action,
        resource_type: resourceType,
        summary,
        created_at: createdAt,
      },
    ];
  });
}

function parseOverview(value: Json | null): DashboardOverview {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      activeClients: 0,
      archivedClients: 0,
      activeStaffProfiles: 0,
      clientsCreatedThisMonth: 0,
      recentActivity: [],
    };
  }

  return {
    activeClients: numberFromJson(value.active_clients),
    archivedClients: numberFromJson(value.archived_clients),
    activeStaffProfiles: numberFromJson(value.active_staff_profiles),
    clientsCreatedThisMonth: numberFromJson(
      value.clients_created_this_month,
    ),
    recentActivity: parseRecentActivity(value.recent_activity),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { profile, supabase } = await requireDashboardUser();
  const [
    { data, error },
    { count: draftQuotationCount },
    { count: sentQuotationCount },
    { count: draftInvoiceCount },
    { count: issuedInvoiceCount },
  ] = await Promise.all([
    supabase.rpc("dashboard_overview"),
    supabase
      .from("quotations")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("quotations")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "issued"),
  ]);
  const overview = parseOverview(data);
  const cards = [
    { label: "Active clients", value: overview.activeClients },
    { label: "Archived clients", value: overview.archivedClients },
    { label: "Active staff profiles", value: overview.activeStaffProfiles },
    {
      label: "Clients created this month",
      value: overview.clientsCreatedThisMonth,
    },
  ];

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow="Business overview"
        title="Dashboard"
        description="A live view of Phase 3 client and staff operations."
        actions={
          canCreateClients(profile.role) ? (
            <Link
              className="dashboard-button dashboard-button-primary"
              href="/dashboard/clients/new"
            >
              Add client
            </Link>
          ) : undefined
        }
      />

      <Notice message={params.message} />
      <Notice message={params.error} tone="error" />
      {error && (
        <Notice
          message="Dashboard totals could not be loaded. Try again."
          tone="error"
        />
      )}

      <section className="dashboard-summary-grid" aria-label="Business totals">
        {cards.map((card) => (
          <article className="dashboard-summary-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-summary-grid" aria-label="Document workflow totals">
        {[
          ["Draft quotations", draftQuotationCount || 0],
          ["Sent quotations", sentQuotationCount || 0],
          ["Draft invoices", draftInvoiceCount || 0],
          ["Issued invoices", issuedInvoiceCount || 0],
        ].map(([label, value]) => (
          <article className="dashboard-summary-card dashboard-summary-card-document" key={String(label)}>
            <span>{String(label)}</span>
            <strong>{String(value)}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-eyebrow">Recent activity</p>
            <h2>Latest operational events</h2>
          </div>
          {(profile.role === "administrator" ||
            profile.role === "accountant") && (
            <Link className="dashboard-button-link" href="/dashboard/activity">
              View activity
            </Link>
          )}
        </div>

        {overview.recentActivity.length > 0 ? (
          <ul className="dashboard-activity-list">
            {overview.recentActivity.map((item) => (
              <li key={item.id}>
                <strong>{titleCase(item.action)}</strong>
                <span>{item.summary}</span>
                <time dateTime={item.created_at}>
                  {formatDateTime(item.created_at)}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <div className="dashboard-empty-state dashboard-empty-state-compact">
            <h2>No activity has been recorded.</h2>
            <p>
              Verified client, staff and settings changes will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
