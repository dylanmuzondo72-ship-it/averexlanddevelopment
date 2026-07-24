"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="dashboard-empty-state" role="alert">
      <p className="dashboard-eyebrow">Unable to load</p>
      <h1>The dashboard could not complete that request.</h1>
      <p>Try again. If the problem continues, contact an administrator.</p>
      <button className="dashboard-button dashboard-button-primary" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
