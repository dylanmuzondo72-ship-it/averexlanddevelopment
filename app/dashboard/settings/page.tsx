import { updateCompanySettingsAction } from "@/app/dashboard/settings/actions";
import { CompanySettingsForm } from "@/components/dashboard/settings/CompanySettingsForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireRoles } from "@/lib/dashboard/access";
import { formatDateTime } from "@/lib/dashboard/format";
import type { SettingsFormValues } from "@/lib/dashboard/settings-validation";

function jsonText(value: unknown) {
  return JSON.stringify(value || {}, null, 2);
}

export default async function SettingsPage() {
  const { profile, supabase } = await requireRoles([
    "administrator",
    "accountant",
  ]);
  const { data: settings, error } = await supabase
    .from("company_settings")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (error || !settings) {
    return (
      <div className="dashboard-content">
        <PageHeader eyebrow="Company settings" title="Settings unavailable" />
        <section className="dashboard-empty-state" role="alert">
          <h2>Company settings could not be loaded.</h2>
          <p>Try again or review the Supabase policy configuration.</p>
        </section>
      </div>
    );
  }

  const initialValues: SettingsFormValues = {
    companyName: settings.company_name,
    slogan: settings.slogan,
    ceoName: settings.ceo_name,
    address: settings.address,
    primaryPhone: settings.primary_phone,
    alternativePhone: settings.alternative_phone || "",
    primaryEmail: settings.primary_email,
    alternativeEmail: settings.alternative_email || "",
    defaultCurrency: settings.default_currency,
    defaultTaxRate: String(settings.default_tax_rate),
    defaultQuoteTerms: settings.default_quote_terms,
    defaultInvoiceTerms: settings.default_invoice_terms,
    quotePrefix: settings.quote_prefix,
    invoicePrefix: settings.invoice_prefix,
    receiptPrefix: settings.receipt_prefix,
    landListingPrefix: settings.land_listing_prefix,
    clientPrefix: settings.client_prefix,
    googleMapsQuery: settings.google_maps_query || "",
    googleMapsEmbedUrl: settings.google_maps_embed_url || "",
    socialLinks: jsonText(settings.social_links),
    taxDetails: jsonText(settings.tax_details),
    bankingDetails: jsonText(settings.banking_details),
    ecocashDetails: jsonText(settings.ecocash_details),
    logoPath: settings.logo_path || "",
  };

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow="Company configuration"
        title="Company settings"
        description={
          profile.role === "administrator"
            ? "Manage the central values used by future business records and documents."
            : "Review the central company configuration. Accountant access is read-only."
        }
      />

      {profile.role === "administrator" ? (
        <CompanySettingsForm
          action={updateCompanySettingsAction.bind(null, settings.id)}
          initialValues={initialValues}
        />
      ) : (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>{settings.company_name}</h2>
              <p className="dashboard-panel-subtitle">
                Last updated {formatDateTime(settings.updated_at)}
              </p>
            </div>
            <span className="dashboard-readonly-badge">Read-only</span>
          </div>
          <dl className="dashboard-details-grid">
            {Object.entries({
              Slogan: settings.slogan,
              CEO: settings.ceo_name,
              Address: settings.address,
              "Primary phone": settings.primary_phone,
              "Alternative phone": settings.alternative_phone,
              "Primary email": settings.primary_email,
              "Alternative email": settings.alternative_email,
              Currency: settings.default_currency,
              "Tax rate": `${settings.default_tax_rate}%`,
              "Quote prefix": settings.quote_prefix,
              "Invoice prefix": settings.invoice_prefix,
              "Receipt prefix": settings.receipt_prefix,
              "Land prefix": settings.land_listing_prefix,
              "Client prefix": settings.client_prefix,
              "Logo path": settings.logo_path,
            }).map(([label, value]) => (
              <div className="dashboard-detail" key={label}>
                <dt>{label}</dt>
                <dd>{value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
          <div className="dashboard-settings-json-grid">
            {[
              ["Social links", settings.social_links],
              ["Tax details", settings.tax_details],
              ["Banking details", settings.banking_details],
              ["EcoCash details", settings.ecocash_details],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <h3>{String(label)}</h3>
                <pre>{jsonText(value)}</pre>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
