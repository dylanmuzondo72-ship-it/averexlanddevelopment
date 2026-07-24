import { titleCase } from "@/lib/dashboard/format";

export function StatusBadge({
  status,
}: {
  status: "active" | "archived" | "inactive";
}) {
  return (
    <span className={`dashboard-status dashboard-status-${status}`}>
      {titleCase(status)}
    </span>
  );
}
