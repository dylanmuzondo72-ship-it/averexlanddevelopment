"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type {
  ClientFormState,
  ClientFormValues,
} from "@/lib/dashboard/client-validation";
import type { AppRole } from "@/lib/dashboard/permissions";

type AssignableProfile = {
  id: string;
  label: string;
};

type ClientFormAction = (
  previousState: ClientFormState,
  formData: FormData,
) => Promise<ClientFormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="dashboard-button dashboard-button-primary"
      type="submit"
      disabled={pending}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function FieldError({
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

export function ClientForm({
  action,
  initialValues,
  role,
  assignableProfiles,
  submitLabel,
  cancelHref,
}: {
  action: ClientFormAction;
  initialValues: ClientFormValues;
  role: AppRole;
  assignableProfiles: AssignableProfile[];
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState<ClientFormState, FormData>(
    action,
    {
      values: initialValues,
      fieldErrors: {},
    },
  );
  const [clientType, setClientType] = useState(initialValues.clientType);
  const values = state.values;

  return (
    <form className="dashboard-panel dashboard-form" action={formAction}>
      {state.formError && (
        <p
          className="dashboard-notice dashboard-notice-error"
          role="alert"
        >
          {state.formError}
        </p>
      )}

      {state.duplicateWarning && (
        <div className="dashboard-notice dashboard-notice-warning" role="alert">
          <strong>{state.duplicateWarning}</strong>
          {state.duplicates && state.duplicates.length > 0 && (
            <ul>
              {state.duplicates.map((duplicate) => (
                <li key={duplicate.clientReference}>
                  {duplicate.clientReference}: {duplicate.displayName}
                </li>
              ))}
            </ul>
          )}
          <label className="dashboard-checkbox">
            <input type="checkbox" name="confirmDuplicate" value="yes" />
            Continue and create or update this record after reviewing the match.
          </label>
        </div>
      )}

      <section className="dashboard-form-section">
        <h2>Client identity</h2>
        <div className="dashboard-form-grid">
          <label className="dashboard-field">
            <span>Client type</span>
            <select
              name="clientType"
              value={clientType}
              onChange={(event) =>
                setClientType(
                  event.target.value === "company" ? "company" : "individual",
                )
              }
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </select>
          </label>

          <label className="dashboard-field">
            <span>Display name *</span>
            <input
              name="displayName"
              defaultValue={values.displayName}
              required
              maxLength={160}
              aria-invalid={Boolean(state.fieldErrors.displayName)}
              aria-describedby="displayName-error"
            />
            <FieldError
              id="displayName-error"
              message={state.fieldErrors.displayName}
            />
          </label>

          {clientType === "company" && (
            <label className="dashboard-field">
              <span>Company name *</span>
              <input
                name="companyName"
                defaultValue={values.companyName}
                required
                maxLength={160}
                aria-invalid={Boolean(state.fieldErrors.companyName)}
                aria-describedby="companyName-error"
              />
              <FieldError
                id="companyName-error"
                message={state.fieldErrors.companyName}
              />
            </label>
          )}

          {clientType === "individual" && (
            <input type="hidden" name="companyName" value="" />
          )}

          <label className="dashboard-field">
            <span>Contact person</span>
            <input
              name="contactPerson"
              defaultValue={values.contactPerson}
              maxLength={160}
              aria-invalid={Boolean(state.fieldErrors.contactPerson)}
              aria-describedby="contactPerson-error"
            />
            <FieldError
              id="contactPerson-error"
              message={state.fieldErrors.contactPerson}
            />
          </label>
        </div>
      </section>

      <section className="dashboard-form-section">
        <h2>Contact information</h2>
        <div className="dashboard-form-grid">
          <label className="dashboard-field">
            <span>Primary phone *</span>
            <input
              name="phone"
              type="tel"
              defaultValue={values.phone}
              required
              maxLength={40}
              aria-invalid={Boolean(state.fieldErrors.phone)}
              aria-describedby="phone-error"
            />
            <FieldError id="phone-error" message={state.fieldErrors.phone} />
          </label>

          <label className="dashboard-field">
            <span>Alternative phone</span>
            <input
              name="alternativePhone"
              type="tel"
              defaultValue={values.alternativePhone}
              maxLength={40}
              aria-invalid={Boolean(state.fieldErrors.alternativePhone)}
              aria-describedby="alternativePhone-error"
            />
            <FieldError
              id="alternativePhone-error"
              message={state.fieldErrors.alternativePhone}
            />
          </label>

          <label className="dashboard-field">
            <span>Email address</span>
            <input
              name="email"
              type="email"
              defaultValue={values.email}
              maxLength={254}
              aria-invalid={Boolean(state.fieldErrors.email)}
              aria-describedby="email-error"
            />
            <FieldError id="email-error" message={state.fieldErrors.email} />
          </label>

          <label className="dashboard-field">
            <span>Tax number</span>
            <input
              name="taxNumber"
              defaultValue={values.taxNumber}
              maxLength={100}
              aria-invalid={Boolean(state.fieldErrors.taxNumber)}
              aria-describedby="taxNumber-error"
            />
            <FieldError
              id="taxNumber-error"
              message={state.fieldErrors.taxNumber}
            />
          </label>
        </div>
      </section>

      <section className="dashboard-form-section">
        <h2>Addresses and assignment</h2>
        <div className="dashboard-form-grid">
          <label className="dashboard-field">
            <span>Physical address</span>
            <textarea
              name="physicalAddress"
              defaultValue={values.physicalAddress}
              maxLength={500}
              aria-invalid={Boolean(state.fieldErrors.physicalAddress)}
              aria-describedby="physicalAddress-error"
            />
            <FieldError
              id="physicalAddress-error"
              message={state.fieldErrors.physicalAddress}
            />
          </label>

          <label className="dashboard-field">
            <span>Billing address</span>
            <textarea
              name="billingAddress"
              defaultValue={values.billingAddress}
              maxLength={500}
              aria-invalid={Boolean(state.fieldErrors.billingAddress)}
              aria-describedby="billingAddress-error"
            />
            <FieldError
              id="billingAddress-error"
              message={state.fieldErrors.billingAddress}
            />
          </label>

          {role === "administrator" ? (
            <label className="dashboard-field">
              <span>Assigned staff member</span>
              <select
                name="assignedTo"
                defaultValue={values.assignedTo}
                aria-invalid={Boolean(state.fieldErrors.assignedTo)}
                aria-describedby="assignedTo-error"
              >
                <option value="">Unassigned</option>
                {assignableProfiles.map((profile) => (
                  <option value={profile.id} key={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
              <FieldError
                id="assignedTo-error"
                message={state.fieldErrors.assignedTo}
              />
            </label>
          ) : (
            <div className="dashboard-field">
              <span>Assignment</span>
              <p className="dashboard-field-hint">
                Staff-created clients are assigned to the staff member creating
                the record.
              </p>
              <input type="hidden" name="assignedTo" value="" />
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-form-section">
        <h2>Internal notes</h2>
        <label className="dashboard-field">
          <span>Notes</span>
          <textarea
            name="notes"
            defaultValue={values.notes}
            maxLength={5000}
            aria-invalid={Boolean(state.fieldErrors.notes)}
            aria-describedby="notes-error"
          />
          <FieldError id="notes-error" message={state.fieldErrors.notes} />
        </label>
      </section>

      <div className="dashboard-form-actions">
        <Link className="dashboard-button dashboard-button-secondary" href={cancelHref}>
          Cancel
        </Link>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
