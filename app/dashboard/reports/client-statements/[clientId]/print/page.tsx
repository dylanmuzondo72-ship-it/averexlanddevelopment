import { notFound } from "next/navigation";
import { companySettings } from "@/lib/company";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { getReportRange, money } from "@/lib/dashboard/reports";

export const dynamic = "force-dynamic";

export default async function ClientStatementPrint({ params, searchParams }: { params: Promise<{ clientId: string }>; searchParams: Promise<{ from?: string; to?: string }> }) {
  const { clientId } = await params;
  const p = await searchParams;
  const { supabase } = await requireDashboardUser();
  const period = getReportRange("custom", p.from, p.to);
  const [{ data: client }, { data: invoices }] = await Promise.all([
    supabase.from("clients").select("display_name,phone,email").eq("id", clientId).maybeSingle(),
    supabase.from("invoices").select("invoice_number,issue_date,due_date,grand_total,amount_paid,balance_due,currency,payment_state").eq("client_id", clientId).gte("issue_date", period.from).lte("issue_date", period.to).order("issue_date"),
  ]);
  if (!client) notFound();
  return <main className="print-document"><header><img src={companySettings.assets.logo} alt={companySettings.name} /><h1>Client statement</h1><p>{companySettings.name}<br />{companySettings.address}<br />{period.from} to {period.to}</p></header><h2>{client.display_name}</h2><p>{client.phone} · {client.email || "No email"}</p><table><thead><tr><th>Invoice</th><th>Issue date</th><th>Due date</th><th>Total</th><th>Paid</th><th>Balance</th><th>State</th></tr></thead><tbody>{(invoices || []).map((i: any) => <tr key={i.invoice_number}><td>{i.invoice_number}</td><td>{i.issue_date}</td><td>{i.due_date}</td><td>{money(i.grand_total, i.currency)}</td><td>{money(i.amount_paid, i.currency)}</td><td>{money(i.balance_due, i.currency)}</td><td>{i.payment_state}</td></tr>)}</tbody></table><footer>{companySettings.slogan}</footer></main>;
}
