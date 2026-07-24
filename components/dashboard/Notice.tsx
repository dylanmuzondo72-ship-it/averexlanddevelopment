export function Notice({
  message,
  tone = "success",
}: {
  message?: string;
  tone?: "success" | "error" | "warning";
}) {
  if (!message) return null;

  return (
    <p className={`dashboard-notice dashboard-notice-${tone}`} role="status">
      {message}
    </p>
  );
}
