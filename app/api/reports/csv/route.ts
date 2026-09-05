import { NextResponse } from "next/server";
import { csvCell } from "@/lib/dashboard/csv";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { getReportData, getReportRange } from "@/lib/dashboard/reports";

function csv(rows: string[][]) { return rows.map((row) => row.map(csvCell).join(",")).join("\r\n"); }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { supabase } = await requireDashboardUser();
  const period = getReportRange(searchParams.get("range") || "custom", searchParams.get("from") || undefined, searchParams.get("to") || undefined);
  const type = searchParams.get("type") || "invoices";
  const data = await getReportData(supabase, period);
  let rows: string[][];
  if (type === "payments") {
    rows = [["Payment reference", "Client", "Payment date", "Method", "Amount", "Currency", "Status", "External reference"], ...data.payments.map((p: any) => [p.payment_reference, p.clients?.display_name, p.payment_date, p.payment_method, p.amount, p.currency, p.status, p.external_reference])];
  } else if (type === "quotations") {
    rows = [["Quotation number", "Client", "Date", "Total", "Status", "Converted"], ...data.quotations.map((q: any) => [q.quote_number, q.clients?.display_name, q.issue_date, q.grand_total, q.status, q.converted_at ? "Yes" : "No"])];
  } else if (type === "monthly") {
    const months = [...new Set([...data.invoices.map((i: any) => i.issue_date.slice(0, 7)), ...data.payments.map((p: any) => p.payment_date.slice(0, 7)), ...data.clients.map((c: any) => c.created_at.slice(0, 7))])].sort();
    rows = [["Month", "Invoiced", "Payments received", "Outstanding", "Invoices", "New clients"], ...months.map((month) => {
      const invoices = data.invoices.filter((i: any) => i.issue_date.startsWith(month) && i.status === "issued");
      const payments = data.payments.filter((p: any) => p.payment_date.startsWith(month) && p.status === "active");
      return [month, invoices.reduce((sum: number, i: any) => sum + Number(i.grand_total), 0).toFixed(2), payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0).toFixed(2), invoices.reduce((sum: number, i: any) => sum + Number(i.balance_due), 0).toFixed(2), String(invoices.length), String(data.clients.filter((c: any) => c.created_at.startsWith(month)).length)];
    })];
  } else if (type === "client-statement") {
    const clientId = searchParams.get("clientId");
    const client = clientId ? (await supabase.from("clients").select("display_name").eq("id", clientId).maybeSingle()).data : null;
    const invoices = clientId ? (await supabase.from("invoices").select("invoice_number,issue_date,due_date,grand_total,amount_paid,balance_due,payment_state").eq("client_id", clientId).gte("issue_date", period.from).lte("issue_date", period.to).order("issue_date")).data || [] : [];
    rows = [["Client", "Invoice", "Issue date", "Due date", "Total", "Paid", "Balance", "Payment state"], ...invoices.map((i: any) => [client?.display_name, i.invoice_number, i.issue_date, i.due_date, i.grand_total, i.amount_paid, i.balance_due, i.payment_state])];
  } else {
    const invoices = data.invoices.filter((i: any) => i.status === "issued" && (type !== "outstanding" && type !== "overdue" || Number(i.balance_due) > 0) && (type !== "overdue" || i.due_date < new Date().toISOString().slice(0, 10)));
    rows = [["Invoice number", "Client", "Issue date", "Due date", "Status", "Payment status", "Total", "Paid", "Balance"], ...invoices.map((i: any) => [i.invoice_number, i.clients?.display_name, i.issue_date, i.due_date, i.status, i.payment_state, i.grand_total, i.amount_paid, i.balance_due])];
  }
  return new NextResponse(`\uFEFF${csv(rows)}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="averex-${type}-${period.from}-to-${period.to}.csv"` } });
}
