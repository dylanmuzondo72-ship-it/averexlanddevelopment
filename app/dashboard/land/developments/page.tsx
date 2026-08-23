import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";
import type { Enums } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
const pageSize = 25;
const href = (p: { q?: string; status?: string }, page: number) => {
  const params = new URLSearchParams(); if (p.q) params.set("q", p.q); if (p.status) params.set("status", p.status); params.set("page", String(page)); return `/dashboard/land/developments?${params}`;
};

export default async function Developments({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const p = await searchParams; const page = Math.max(1, Number.isFinite(Number(p.page)) ? Number(p.page) : 1); const { supabase } = await requireDashboardUser();
  let query = supabase.from("land_developments").select("id,reference_number,name,location,development_type,status,created_at", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  if (p.q) query = query.or(`name.ilike.%${p.q}%,reference_number.ilike.%${p.q}%,location.ilike.%${p.q}%`); if (p.status) query = query.eq("status", p.status as Enums<"land_development_status">);
  const { data, count } = await query; const total = count || 0; const totalPages = Math.max(1, Math.ceil(total / pageSize)); const current = Math.min(page, totalPages); const start = total ? (current - 1) * pageSize + 1 : 0; const end = Math.min(current * pageSize, total);
  return <div className="dashboard-content"><PageHeader eyebrow="Land administration" title="Developments" actions={<Link className="dashboard-button dashboard-button-primary" href="/dashboard/land/developments/new">Add development</Link>} /><form className="dashboard-filter-bar"><input name="q" placeholder="Search name, reference or location" defaultValue={p.q} /><select name="status" defaultValue={p.status || ""}><option value="">All statuses</option><option>draft</option><option>active</option><option>completed</option><option>archived</option></select><button className="dashboard-button dashboard-button-secondary">Filter</button></form><section className="dashboard-panel"><p className="dashboard-field-hint">Showing {start}-{end} of {total} developments</p><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Reference</th><th>Name</th><th>Location</th><th>Type</th><th>Status</th></tr></thead><tbody>{(data || []).map((d) => <tr key={d.id}><td><Link href={`/dashboard/land/developments/${d.id}`}>{d.reference_number}</Link></td><td>{d.name}</td><td>{d.location}</td><td>{d.development_type}</td><td>{d.status}</td></tr>)}</tbody></table></div>{(!data || data.length === 0) && <p className="dashboard-empty-copy">No developments found.</p>}<nav className="dashboard-pagination" aria-label="Development pages"><Link aria-disabled={current <= 1} href={href(p, Math.max(1, current - 1))}>Previous</Link><span>Page {current} of {totalPages}</span><Link aria-disabled={current >= totalPages} href={href(p, Math.min(totalPages, current + 1))}>Next</Link></nav></section></div>;
}
