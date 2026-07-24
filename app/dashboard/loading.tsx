export default function DashboardLoading() {
  return (
    <div className="dashboard-loading" aria-live="polite">
      <span className="dashboard-loading-bar" />
      <span className="dashboard-loading-bar" />
      <span className="dashboard-loading-bar dashboard-loading-bar-short" />
      <p>Loading business records...</p>
    </div>
  );
}
