import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getCount(
  table: "profiles" | "activity_logs" | "company_settings",
) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) return null;
  return count ?? 0;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [profileCount, activityCount, settingsCount] = await Promise.all([
    getCount("profiles"),
    getCount("activity_logs"),
    getCount("company_settings"),
  ]);
  const { data: recentActivity } = await supabase
    .from("activity_logs")
    .select("id, action, resource_type, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const summaryCards = [
    {
      label: "Staff Profiles",
      value: profileCount,
      note: "Visible according to your database role policies.",
    },
    {
      label: "Company Settings",
      value: settingsCount,
      note: "Central configuration records available to the portal.",
    },
    {
      label: "Activity Logs",
      value: activityCount,
      note: "Recorded system activity visible to your role.",
    },
  ];

  return (
    <div className="dashboard-content">
      {params.message && <p className="auth-notice">{params.message}</p>}

      <div className="dashboard-grid">
        {summaryCards.map((card) => (
          <article className="dashboard-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value === null ? "Unavailable" : card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </div>

      <section className="dashboard-panel">
        <div>
          <p className="eyebrow">RECENT ACTIVITY</p>
          <h2>Live database activity</h2>
        </div>
        {recentActivity && recentActivity.length > 0 ? (
          <ul className="activity-list">
            {recentActivity.map((item) => (
              <li key={item.id}>
                <strong>{item.action}</strong>
                <span>
                  {item.resource_type}: {item.summary}
                </span>
                <time dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty">
            No activity has been recorded yet. New events will appear here once
            staff begin using the protected system.
          </p>
        )}
      </section>
    </div>
  );
}
