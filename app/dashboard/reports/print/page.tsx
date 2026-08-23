import { notFound } from "next/navigation";
import { companySettings } from "@/lib/company";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { getReportData, getReportRange, money } from "@/lib/dashboard/reports";

export const dynamic = "force-dynamic";

export default async function ReportPrint({ searchParams }: { searchParams: Promise<{ type?: string; range?: string; from?: string; to?: string }> }) {
  const p = await searchParams;
  const type = p.type || "invoices";
  if (!["invoices", "outstanding", "overdue", "payments", "monthly"].includes(type)) notFound();
  const { supabase } = await requireDashboardUser();
  const period = getReportRange(p.range || "custom", p.from, p.to);
  const data = await getReportData(supabase, period);
  const invoices = data.invoices.filter((i: any) => i.status === "issued" && (type === "invoices" || Number(i.balance_due) > 0) && (type !== "overdue" || i.due_date < new Date().toISOString().slice(0, 10)));
  const payments = data.payments.filter((p: any) => p.status === "active");
  return <main className="print-document"><header><img src={companySettings.assets.logo} alt={companySettings.name} /><h1>{type === "payments" ? "Payments received" : type === "monthly" ? "Monthly business summary" : type === "overdue" ? "Overdue invoices" : type === "outstanding" ? "Outstanding balances" : "Invoice report"}</h1><p>{companySettings.name}<br />{companySettings.address}<br />{period.from} to {period.to}</p></header><table><thead><tr><th>Reference</th><th>Client</th><th>Date</th><th>Amount / Balance</th><th>Status</th></tr></thead><tbody>{type === "payments" ? payments.map((p: any) => <tr key={p.id}><td>{p.payment_reference}</td><td>{p.clients?.display_name || "-"}</td><td>{p.payment_date}</td><td>{money(p.amount, p.currency)}</td><td>{p.status}</td></tr>) : invoices.map((i: any) => <tr key={i.id}><td>{i.invoice_number}</td><td>{i.clients?.display_name || "-"}</td><td>{i.issue_date}</td><td>{money(type === "invoices" ? i.grand_total : i.balance_due, i.currency)}</td><td>{i.payment_state}</td></tr>)}</tbody></table><footer>{companySettings.slogan}</footer></main>;
}
