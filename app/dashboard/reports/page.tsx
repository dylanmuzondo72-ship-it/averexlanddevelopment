import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { getReportData, getReportRange, money } from "@/lib/dashboard/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireDashboardUser();
  const period = getReportRange(params.range, params.from, params.to);
  const data = await getReportData(supabase, period);
  const issued = data.invoices.filter((invoice: any) => invoice.status === "issued");
  const activePayments = data.payments.filter((payment: any) => payment.status === "active");
  const total = (rows: any[], field: string) => rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  const cards = [
    ["Total invoiced", money(total(issued, "grand_total"))],
    ["Payments received", money(total(activePayments, "amount"))],
    ["Outstanding balance", money(total(issued, "balance_due"))],
    ["Unpaid invoices", issued.filter((i: any) => i.payment_state === "unpaid").length],
    ["Partially paid", issued.filter((i: any) => i.payment_state === "partially_paid").length],
    ["Fully paid", issued.filter((i: any) => i.payment_state === "paid").length],
    ["Overdue invoices", issued.filter((i: any) => i.balance_due > 0 && i.due_date < period.to).length],
    ["Active clients", data.clients.filter((c: any) => c.status === "active").length],
    ["Quotations created", data.quotations.length],
  ];
  return <div className="dashboard-content"><PageHeader eyebrow="Business intelligence" title="Reports" description={`Authoritative reporting from ${period.from} to ${period.to}. Payments are counted once; receipts are evidence only.`} />
    <form className="dashboard-panel dashboard-filter-form" method="get"><label>Period<select name="range" defaultValue={params.range || "this_month"}><option value="today">Today</option><option value="this_week">This week</option><option value="this_month">This month</option><option value="last_month">Last month</option><option value="this_year">This year</option><option value="custom">Custom</option></select></label><label>From<input type="date" name="from" defaultValue={params.from} /></label><label>To<input type="date" name="to" defaultValue={params.to} /></label><button className="dashboard-button dashboard-button-secondary" type="submit">Apply period</button></form>
    <section className="dashboard-grid">{cards.map(([label, value]) => <article className="dashboard-card" key={label}><span>{label}</span><strong>{value}</strong><p>Current selected period</p></article>)}</section>
    <section className="dashboard-panel"><h2>Report centre</h2><div className="dashboard-link-grid">{[["/dashboard/reports/invoices","Invoice report"],["/dashboard/reports/outstanding","Outstanding balances"],["/dashboard/reports/overdue","Overdue and aging"],["/dashboard/reports/payments","Payments received"],["/dashboard/reports/quotations","Quotation performance"],["/dashboard/reports/client-statements","Client statements"],["/dashboard/reports/monthly-summary","Monthly summary"],["/dashboard/reports/activity","Staff activity"]].map(([href,label]) => <Link className="dashboard-button dashboard-button-secondary" href={href} key={href}>{label}</Link>)}</div></section>
    <section className="dashboard-panel"><h2>Recent financial activity</h2>{data.activity.length === 0 ? <p className="dashboard-empty-copy">No activity in this period.</p> : <ul className="activity-list">{data.activity.slice(0, 10).map((row: any) => <li key={row.id}><time>{new Date(row.created_at).toLocaleDateString("en-ZW")}</time><span>{row.summary}</span><strong>{row.profiles?.full_name || "System"}</strong></li>)}</ul>}</section>
  </div>;
}
