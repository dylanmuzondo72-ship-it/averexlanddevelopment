import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportRange = { from: string; to: string };

export function getReportRange(range: string | undefined, from?: string, to?: string): ReportRange {
  const now = new Date();
  const end = to || now.toISOString().slice(0, 10);
  if (range === "custom" && from && to) return { from, to };
  if (range === "today") return { from: end, to: end };
  if (range === "last_month") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
  }
  if (range === "this_year") return { from: `${now.getFullYear()}-01-01`, to: end };
  if (range === "this_week") {
    const first = new Date(now);
    first.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return { from: first.toISOString().slice(0, 10), to: end };
  }
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: first.toISOString().slice(0, 10), to: end };
}

export function money(value: number | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0));
}

export async function getReportData(supabase: SupabaseClient, range: ReportRange) {
  const [invoices, payments, clients, quotations, activity] = await Promise.all([
    supabase.from("invoices").select("id,invoice_number,client_id,issue_date,due_date,status,payment_state,grand_total,amount_paid,balance_due,clients(display_name)").gte("issue_date", range.from).lte("issue_date", range.to).order("issue_date", { ascending: false }).limit(500),
    supabase.from("payments").select("id,payment_reference,client_id,payment_date,payment_method,amount,currency,status,external_reference,clients(display_name),payment_allocations(invoice_id,invoices(invoice_number))").gte("payment_date", range.from).lte("payment_date", range.to).order("payment_date", { ascending: false }).limit(500),
    supabase.from("clients").select("id,display_name,client_reference,status,created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("quotations").select("id,quote_number,client_id,issue_date,status,grand_total,converted_at,clients(display_name)").gte("issue_date", range.from).lte("issue_date", range.to).order("issue_date", { ascending: false }).limit(500),
    supabase.from("activity_logs").select("id,action,resource_type,summary,created_at,profiles(full_name)").gte("created_at", `${range.from}T00:00:00+02:00`).lte("created_at", `${range.to}T23:59:59+02:00`).order("created_at", { ascending: false }).limit(100),
  ]);
  return {
    invoices: invoices.data || [], payments: payments.data || [], clients: clients.data || [], quotations: quotations.data || [], activity: activity.data || [],
  };
}
