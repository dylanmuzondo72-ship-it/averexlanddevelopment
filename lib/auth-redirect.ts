export function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/dashboard";
  const url = new URL(value, "https://averex.invalid");
  if (url.origin !== "https://averex.invalid" || url.pathname.startsWith("/login") || url.pathname.startsWith("/auth")) return "/dashboard";
  return `${url.pathname}${url.search}${url.hash}`;
}
