export function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-ZW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-ZW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function titleCase(value: string) {
  return value
    .split(/[._-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getPageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}
