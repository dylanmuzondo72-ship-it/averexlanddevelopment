import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Notice } from "@/components/dashboard/Notice";
import { Pagination } from "@/components/dashboard/Pagination";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { formatDate, getPageCount, titleCase } from "@/lib/dashboard/format";
import { formatMoney } from "@/lib/dashboard/document-format";
import { canCreateInvoices } from "@/lib/dashboard/permissions";

const pageSize = 20;

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function buildHref(filters: Record<string, string>, page: number) {
  const params = new URLSearchParams();
  Object.entries({ ...filters, page: String(page) }).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return "/dashboard/invoices?" + params.toString();
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { profile, supabase } = await requireDashboardUser();
  const filters = {
    search: queryValue(params.search),
    status: queryValue(params.status),
    from: queryValue(params.from),
    to: queryValue(params.to),
    sort: queryValue(params.sort) || "newest",
    page: queryValue(params.page),
  };
  const currentPage = Math.max(1, Number(filters.page) || 1);
  const { data, error } = await supabase.rpc("search_invoices", {
    search_term: filters.search || undefined,
    status_filter: filters.status || undefined,
    date_from: filters.from || undefined,
    date_to: filters.to || undefined,
    sort_order: filters.sort,
    page_size: pageSize,
    page_offset: (currentPage - 1) * pageSize,
  });
  const invoices = data || [];
  const totalCount = Number(invoices[0]?.total_count || 0);
  const totalPages = getPageCount(totalCount, pageSize);

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow="Commercial documents"
        title="Invoices"
        description="Review draft and issued invoices. Financial values are recalculated and protected on the server."
        actions={
          canCreateInvoices(profile.role) ? (
            <Link className="dashboard-button dashboard-button-primary" href="/dashboard/invoices/new">
              New invoice
            </Link>
          ) : undefined
        }
      />
      <Notice message={queryValue(params.message)} />
      <Notice message={queryValue(params.error)} tone="error" />

      <form className="dashboard-filter-bar" method="get">
        <label className="dashboard-field"><span>Search</span><input name="search" defaultValue={filters.search} placeholder="Invoice, client or subject" /></label>
        <label className="dashboard-field"><span>Status</span><select name="status" defaultValue={filters.status}><option value="">All statuses</option>{["draft", "issued", "overdue", "cancelled"].map((status) => <option value={status} key={status}>{titleCase(status)}</option>)}</select></label>
        <label className="dashboard-field"><span>From</span><input type="date" name="from" defaultValue={filters.from} /></label>
        <label className="dashboard-field"><span>To</span><input type="date" name="to" defaultValue={filters.to} /></label>
        <label className="dashboard-field"><span>Sort</span><select name="sort" defaultValue={filters.sort}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="due_date">Due date</option><option value="total_asc">Total, low to high</option><option value="total_desc">Total, high to low</option><option value="client">Client</option></select></label>
        <button className="dashboard-button dashboard-button-secondary" type="submit">Apply</button>
      </form>

      {error ? (
        <section className="dashboard-empty-state" role="alert"><h2>Invoices could not be loaded.</h2><p>Refresh the page or ask an administrator to review access.</p></section>
      ) : invoices.length > 0 ? (
        <>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table document-list-table">
              <thead><tr><th>Invoice</th><th>Client</th><th>Status</th><th>Dates</th><th>Total</th><th>Balance</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td data-label="Invoice"><div className="dashboard-table-primary"><strong>{invoice.invoice_number || "Draft invoice"}</strong><span>{invoice.subject}</span></div></td>
                    <td data-label="Client">{invoice.client_name || "Client snapshot unavailable"}</td>
                    <td data-label="Status"><span className={"document-status-badge document-status-" + invoice.effective_status}>{titleCase(invoice.effective_status)}</span></td>
                    <td data-label="Dates"><div className="dashboard-table-primary"><span>Issued {formatDate(invoice.issue_date)}</span><span>Due {formatDate(invoice.due_date)}</span></div></td>
                    <td data-label="Total">{formatMoney(invoice.grand_total, invoice.currency)}</td>
                    <td data-label="Balance">{formatMoney(invoice.balance_due, invoice.currency)}</td>
                    <td data-label="Actions"><Link href={"/dashboard/invoices/" + invoice.id}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={(page) => buildHref(filters, page)} />
        </>
      ) : (
        <section className="dashboard-empty-state">
          <p className="dashboard-eyebrow">No matching invoices</p>
          <h2>{filters.search || filters.status || filters.from || filters.to ? "No invoices match these filters." : "No invoices have been created."}</h2>
          <p>Invoices will appear here after an authorised administrator or accountant creates one.</p>
          {canCreateInvoices(profile.role) && <Link className="dashboard-button dashboard-button-primary" href="/dashboard/invoices/new">Create the first invoice</Link>}
        </section>
      )}
    </div>
  );
}
