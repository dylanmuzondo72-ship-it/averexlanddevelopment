"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type {
  SettingsFormState,
  SettingsFormValues,
} from "@/lib/dashboard/settings-validation";

type SettingsAction = (
  previousState: SettingsFormState,
  formData: FormData,
) => Promise<SettingsFormState>;

function SettingsSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="dashboard-button dashboard-button-primary"
      type="submit"
      disabled={pending}
    >
      {pending ? "Saving..." : "Save company settings"}
    </button>
  );
}

function ErrorText({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <span className="dashboard-field-error" id={id}>
      {message}
    </span>
  );
}

export function CompanySettingsForm({
  action,
  initialValues,
}: {
  action: SettingsAction;
  initialValues: SettingsFormValues;
}) {
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    action,
    { values: initialValues, fieldErrors: {} },
  );
  const values = state.values;

  const input = (
    name: keyof SettingsFormValues,
    label: string,
    options: {
      required?: boolean;
      type?: string;
      maxLength?: number;
    } = {},
  ) => (
    <label className="dashboard-field">
      <span>{label}</span>
      <input
        name={name}
        defaultValue={values[name]}
        required={options.required}
        type={options.type || "text"}
        maxLength={options.maxLength || 500}
        aria-invalid={Boolean(state.fieldErrors[name])}
        aria-describedby={`${name}-error`}
      />
      <ErrorText id={`${name}-error`} message={state.fieldErrors[name]} />
    </label>
  );

  const textarea = (
    name: keyof SettingsFormValues,
    label: string,
    hint?: string,
  ) => (
    <label className="dashboard-field">
      <span>{label}</span>
      <textarea
        name={name}
        defaultValue={values[name]}
        aria-invalid={Boolean(state.fieldErrors[name])}
        aria-describedby={`${name}-error`}
      />
      {hint && <span className="dashboard-field-hint">{hint}</span>}
      <ErrorText id={`${name}-error`} message={state.fieldErrors[name]} />
    </label>
  );

  return (
    <form className="dashboard-panel dashboard-form" action={formAction}>
      {state.formError && (
        <p className="dashboard-notice dashboard-notice-error" role="alert">
          {state.formError}
        </p>
      )}
      {state.message && (
        <p className="dashboard-notice" role="status">
          {state.message}
        </p>
      )}

      <section className="dashboard-form-section">
        <h2>Company identity</h2>
        <div className="dashboard-form-grid">
          {input("companyName", "Company name *", { required: true })}
          {input("slogan", "Slogan *", { required: true })}
          {input("ceoName", "CEO name *", { required: true })}
          {input("logoPath", "Logo path", { maxLength: 300 })}
          <div className="dashboard-field-wide">
            {textarea("address", "Address *")}
          </div>
        </div>
      </section>

      <section className="dashboard-form-section">
        <h2>Contact details</h2>
        <div className="dashboard-form-grid">
          {input("primaryPhone", "Primary phone *", {
            required: true,
            type: "tel",
            maxLength: 40,
          })}
          {input("alternativePhone", "Alternative phone", {
            type: "tel",
            maxLength: 40,
          })}
          {input("primaryEmail", "Primary email *", {
            required: true,
            type: "email",
            maxLength: 254,
          })}
          {input("alternativeEmail", "Alternative email", {
            type: "email",
            maxLength: 254,
          })}
        </div>
      </section>

      <section className="dashboard-form-section">
        <h2>Defaults and prefixes</h2>
        <div className="dashboard-form-grid dashboard-form-grid-three">
          {input("defaultCurrency", "Default currency *", {
            required: true,
            maxLength: 3,
          })}
          {input("defaultTaxRate", "Default tax rate (%)", {
            required: true,
            type: "number",
          })}
          {input("quotePrefix", "Quote prefix *", { required: true })}
          {input("invoicePrefix", "Invoice prefix *", { required: true })}
          {input("receiptPrefix", "Receipt prefix *", { required: true })}
          {input("landListingPrefix", "Land-listing prefix *", {
            required: true,
          })}
          {input("clientPrefix", "Client prefix *", { required: true })}
        </div>
        <div className="dashboard-form-grid">
          {textarea("defaultQuoteTerms", "Default quote terms")}
          {textarea("defaultInvoiceTerms", "Default invoice terms")}
        </div>
      </section>

      <section className="dashboard-form-section">
        <h2>Maps and social links</h2>
        <div className="dashboard-form-grid">
          {input("googleMapsQuery", "Google Maps query")}
          {input("googleMapsEmbedUrl", "Google Maps embed URL", {
            type: "url",
          })}
          <div className="dashboard-field-wide">
            {textarea(
              "socialLinks",
              "Social links (JSON)",
              'Example: {"facebook":"https://example.com"}',
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-form-section">
        <h2>Business and payment details</h2>
        <div className="dashboard-form-grid">
          {textarea("taxDetails", "Tax details (JSON)")}
          {textarea("bankingDetails", "Banking details (JSON)")}
          {textarea("ecocashDetails", "EcoCash details (JSON)")}
        </div>
      </section>

      <div className="dashboard-form-actions">
        <SettingsSubmitButton />
      </div>
    </form>
  );
}
