"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { calculatePreviewTotals, formatMoney } from "@/lib/dashboard/document-format";
import {
  createEmptyDocumentItem,
} from "@/lib/dashboard/document-validation";
import type {
  DiscountType,
  DocumentAssigneeOption,
  DocumentClientOption,
  DocumentFormState,
  DocumentFormValues,
  DocumentItemValues,
  DocumentKind,
  TaxMode,
} from "@/lib/dashboard/document-types";

type DocumentAction = (
  previousState: DocumentFormState,
  formData: FormData,
) => Promise<DocumentFormState>;

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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span className="dashboard-field-error" id={id}>
      {message}
    </span>
  );
}

function nextItemId() {
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function DocumentForm({
  kind,
  action,
  initialValues,
  clients,
  assignees = [],
  mayAssign = false,
  submitLabel,
}: {
  kind: DocumentKind;
  action: DocumentAction;
  initialValues: DocumentFormValues;
  clients: DocumentClientOption[];
  assignees?: DocumentAssigneeOption[];
  mayAssign?: boolean;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<DocumentFormState, FormData>(
    action,
    { values: initialValues, fieldErrors: {} },
  );
  const [items, setItems] = useState<DocumentItemValues[]>(
    initialValues.items.length > 0
      ? initialValues.items
      : [createEmptyDocumentItem()],
  );
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialValues.discountType,
  );
  const [discountValue, setDiscountValue] = useState(
    initialValues.discountValue,
  );
  const [taxMode, setTaxMode] = useState<TaxMode>(initialValues.taxMode);
  const [taxRate, setTaxRate] = useState(initialValues.taxRate);
  const [currency, setCurrency] = useState(initialValues.currency);
  const [dirty, setDirty] = useState(false);
  const values = state.values;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const totals = useMemo(
    () =>
      calculatePreviewTotals({
        items,
        discountType,
        discountValue,
        taxMode,
        taxRate,
      }),
    [discountType, discountValue, items, taxMode, taxRate],
  );

  const updateItem = (
    id: string,
    field: keyof DocumentItemValues,
    value: string | boolean,
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
    setDirty(true);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= items.length) return;
    setItems((current) => {
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [
        reordered[destination],
        reordered[index],
      ];
      return reordered;
    });
    setDirty(true);
  };

  return (
    <form
      className="dashboard-document-form"
      action={formAction}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
    >
      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(items)}
      />
      <input type="hidden" name="lockVersion" value={values.lockVersion} />

      {state.formError && (
        <p className="dashboard-notice dashboard-notice-error" role="alert">
          {state.formError}
        </p>
      )}

      <section className="dashboard-panel dashboard-form">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-eyebrow">Document details</p>
            <h2>
              {kind === "quotation"
                ? "Quotation information"
                : "Invoice information"}
            </h2>
          </div>
        </div>
        <div className="dashboard-form-grid">
          <label className="dashboard-field dashboard-field-wide">
            <span>Client *</span>
            <select
              name="clientId"
              defaultValue={values.clientId}
              required
              aria-invalid={Boolean(state.fieldErrors.clientId)}
              aria-describedby="clientId-error"
            >
              <option value="">Select an active client</option>
              {clients.map((client) => (
                <option value={client.id} key={client.id}>
                  {client.client_reference} - {client.display_name}
                </option>
              ))}
            </select>
            <FieldError
              id="clientId-error"
              message={state.fieldErrors.clientId}
            />
          </label>

          <label className="dashboard-field dashboard-field-wide">
            <span>Subject *</span>
            <input
              name="subject"
              defaultValue={values.subject}
              required
              maxLength={200}
              aria-invalid={Boolean(state.fieldErrors.subject)}
              aria-describedby="subject-error"
            />
            <FieldError
              id="subject-error"
              message={state.fieldErrors.subject}
            />
          </label>

          {kind === "quotation" && (
            <label className="dashboard-field dashboard-field-wide">
              <span>Introduction</span>
              <textarea
                name="introduction"
                defaultValue={values.introduction}
                rows={3}
              />
            </label>
          )}

          <label className="dashboard-field">
            <span>Issue date *</span>
            <input
              type="date"
              name="issueDate"
              defaultValue={values.issueDate}
              required
              aria-invalid={Boolean(state.fieldErrors.issueDate)}
              aria-describedby="issueDate-error"
            />
            <FieldError
              id="issueDate-error"
              message={state.fieldErrors.issueDate}
            />
          </label>

          <label className="dashboard-field">
            <span>{kind === "quotation" ? "Expiry" : "Due"} date *</span>
            <input
              type="date"
              name="secondaryDate"
              defaultValue={values.secondaryDate}
              required
              aria-invalid={Boolean(state.fieldErrors.secondaryDate)}
              aria-describedby="secondaryDate-error"
            />
            <FieldError
              id="secondaryDate-error"
              message={state.fieldErrors.secondaryDate}
            />
          </label>

          <label className="dashboard-field">
            <span>Currency *</span>
            <input
              name="currency"
              value={currency}
              maxLength={3}
              required
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              aria-invalid={Boolean(state.fieldErrors.currency)}
              aria-describedby="currency-error"
            />
            <FieldError
              id="currency-error"
              message={state.fieldErrors.currency}
            />
          </label>

          {kind === "quotation" && mayAssign && (
            <label className="dashboard-field">
              <span>Assigned staff</span>
              <select name="assignedTo" defaultValue={values.assignedTo}>
                <option value="">Unassigned</option>
                {assignees.map((assignee) => (
                  <option value={assignee.id} key={assignee.id}>
                    {assignee.display_name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      <section className="dashboard-panel dashboard-form">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-eyebrow">Work and charges</p>
            <h2>Line items</h2>
          </div>
          <button
            className="dashboard-button dashboard-button-secondary"
            type="button"
            onClick={() => {
              setItems((current) => [
                ...current,
                { ...createEmptyDocumentItem(current.length + 1), id: nextItemId() },
              ]);
              setDirty(true);
            }}
          >
            Add item
          </button>
        </div>

        <FieldError id="items-error" message={state.fieldErrors.items} />
        <div className="dashboard-line-items">
          {items.map((item, index) => (
            <article className="dashboard-line-item" key={item.id}>
              <div className="dashboard-line-item-heading">
                <strong>Item {index + 1}</strong>
                <div className="dashboard-line-item-controls">
                  <button
                    type="button"
                    title="Move item up"
                    aria-label={`Move item ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    title="Move item down"
                    aria-label={`Move item ${index + 1} down`}
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    title="Remove item"
                    aria-label={`Remove item ${index + 1}`}
                    disabled={items.length === 1}
                    onClick={() => {
                      setItems((current) =>
                        current.filter((candidate) => candidate.id !== item.id),
                      );
                      setDirty(true);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="dashboard-line-item-grid">
                <label className="dashboard-field dashboard-field-wide">
                  <span>Description *</span>
                  <textarea
                    value={item.description}
                    required
                    rows={2}
                    maxLength={2000}
                    onChange={(event) =>
                      updateItem(item.id, "description", event.target.value)
                    }
                  />
                </label>
                <label className="dashboard-field">
                  <span>Type</span>
                  <select
                    value={item.itemType}
                    onChange={(event) =>
                      updateItem(item.id, "itemType", event.target.value)
                    }
                  >
                    <option value="service">Service</option>
                    <option value="product">Product</option>
                    <option value="fee">Fee</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="dashboard-field">
                  <span>Quantity *</span>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={item.quantity}
                    required
                    onChange={(event) =>
                      updateItem(item.id, "quantity", event.target.value)
                    }
                  />
                </label>
                <label className="dashboard-field">
                  <span>Unit *</span>
                  <input
                    value={item.unit}
                    required
                    maxLength={40}
                    onChange={(event) =>
                      updateItem(item.id, "unit", event.target.value)
                    }
                  />
                </label>
                <label className="dashboard-field">
                  <span>Unit price *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={item.unitPrice}
                    required
                    onChange={(event) =>
                      updateItem(item.id, "unitPrice", event.target.value)
                    }
                  />
                </label>
                <label className="dashboard-field">
                  <span>Line discount</span>
                  <select
                    value={item.discountType}
                    onChange={(event) =>
                      updateItem(item.id, "discountType", event.target.value)
                    }
                  >
                    <option value="none">None</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </label>
                <label className="dashboard-field">
                  <span>Discount value</span>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={item.discountValue}
                    disabled={item.discountType === "none"}
                    onChange={(event) =>
                      updateItem(item.id, "discountValue", event.target.value)
                    }
                  />
                </label>
                <label className="dashboard-checkbox-field">
                  <input
                    type="checkbox"
                    checked={item.taxApplicable}
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        "taxApplicable",
                        event.target.checked,
                      )
                    }
                  />
                  Tax applies
                </label>
                <div className="dashboard-line-total">
                  <span>Preview line total</span>
                  <strong>
                    {formatMoney(totals.lineTotals[index] || 0, currency)}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-document-financial-grid">
        <div className="dashboard-panel dashboard-form">
          <div className="dashboard-panel-header">
            <h2>Discount and tax</h2>
          </div>
          <div className="dashboard-form-grid">
            <label className="dashboard-field">
              <span>Document discount</span>
              <select
                name="discountType"
                value={discountType}
                onChange={(event) =>
                  setDiscountType(event.target.value as DiscountType)
                }
              >
                <option value="none">None</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label className="dashboard-field">
              <span>Discount value</span>
              <input
                name="discountValue"
                type="number"
                min="0"
                step="0.0001"
                value={discountValue}
                disabled={discountType === "none"}
                onChange={(event) => setDiscountValue(event.target.value)}
                aria-invalid={Boolean(state.fieldErrors.discountValue)}
                aria-describedby="discountValue-error"
              />
              <FieldError
                id="discountValue-error"
                message={state.fieldErrors.discountValue}
              />
            </label>
            <label className="dashboard-field">
              <span>Tax treatment</span>
              <select
                name="taxMode"
                value={taxMode}
                onChange={(event) =>
                  setTaxMode(event.target.value as TaxMode)
                }
              >
                <option value="exclusive">Tax exclusive</option>
                <option value="inclusive">Tax inclusive</option>
              </select>
            </label>
            <label className="dashboard-field">
              <span>Tax rate (%)</span>
              <input
                name="taxRate"
                type="number"
                min="0"
                step="0.0001"
                value={taxRate}
                onChange={(event) => setTaxRate(event.target.value)}
                aria-invalid={Boolean(state.fieldErrors.taxRate)}
                aria-describedby="taxRate-error"
              />
              <FieldError
                id="taxRate-error"
                message={state.fieldErrors.taxRate}
              />
            </label>
            <label className="dashboard-field dashboard-field-wide">
              <span>Tax label *</span>
              <input
                name="taxLabel"
                defaultValue={values.taxLabel}
                maxLength={40}
                required
                aria-invalid={Boolean(state.fieldErrors.taxLabel)}
                aria-describedby="taxLabel-error"
              />
              <FieldError
                id="taxLabel-error"
                message={state.fieldErrors.taxLabel}
              />
            </label>
          </div>
        </div>

        <aside className="dashboard-panel dashboard-totals-preview">
          <p className="dashboard-eyebrow">Convenience preview</p>
          <h2>Estimated totals</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(totals.subtotal, currency)}</dd>
            </div>
            <div>
              <dt>Document discount</dt>
              <dd>{formatMoney(totals.discount, currency)}</dd>
            </div>
            <div>
              <dt>Taxable subtotal</dt>
              <dd>{formatMoney(totals.taxableSubtotal, currency)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{formatMoney(totals.tax, currency)}</dd>
            </div>
            <div className="dashboard-totals-grand">
              <dt>Total</dt>
              <dd>{formatMoney(totals.grandTotal, currency)}</dd>
            </div>
          </dl>
          <p>
            PostgreSQL recalculates and stores the authoritative totals when
            the draft is saved.
          </p>
        </aside>
      </section>

      <section className="dashboard-panel dashboard-form">
        <div className="dashboard-form-grid">
          <label className="dashboard-field">
            <span>Terms and conditions</span>
            <textarea
              name="termsConditions"
              defaultValue={values.termsConditions}
              rows={8}
            />
          </label>
          <label className="dashboard-field">
            <span>Internal notes</span>
            <textarea name="notes" defaultValue={values.notes} rows={8} />
          </label>
        </div>
      </section>

      <div className="dashboard-form-actions dashboard-document-form-actions">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
