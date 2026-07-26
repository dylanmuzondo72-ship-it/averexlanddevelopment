# Phase 5 Handoff: Payments and Receipts

## Current implementation

Phase 5 is implemented on `feature/averex-business-system` without changing `main` or creating `phase-5-complete`. Supabase project: `iqakwzkaiyzzigjldwkh`.

## Migration

- `20260726220000_phase_5_payments_receipts.sql`
- `20260726223000_phase_5_payment_proof_storage.sql`
- `20260726223500_phase_5_payment_lint_hardening.sql`

The migration adds `payment_state`, `payment_prefix`, permanent `payment` and `receipt` counters, `payments`, `payment_allocations`, `receipts`, and `payment_proofs` tables. Payment allocations are immutable and support future multi-invoice payments. Receipts store an immutable JSON allocation snapshot; the current UI creates one allocation per payment and displays one invoice.

## Workflows

`record_payment` locks the issued invoice, validates currency/date/amount, prevents overpayment, inserts the payment and immutable allocation, recalculates invoice payment fields, assigns payment and receipt numbers, creates the receipt snapshot and logs activity in one PostgreSQL transaction.

Payment dates may be backdated but future dates are rejected. Draft and cancelled invoices cannot receive payments. Fully paid invoices reject additional payments.

`reverse_payment` locks payment, allocation, receipt and invoice rows, requires a reason, marks payment and receipt reversed, recalculates the invoice and logs the reversal. Payments and allocations are never hard-deleted. Invoice cancellation is blocked while active allocations exist; all active payments must be reversed first.

Invoice document status remains separate from `payment_state` (`unpaid`, `partially_paid`, `paid`). Only protected payment/reversal workflows update `amount_paid`, `balance_due` and `payment_state`.

## Numbering

Permanent internal counter keys are `payment` and `receipt`. Human-readable output uses `payment_prefix` (default `AVX-PAY`) and existing `receipt_prefix` (default `AVX-REC`). Prefix edits cannot reset or reuse sequences. Receipt numbers are assigned only after successful payment creation.

## Security and roles

RLS is enabled on all Phase 5 tables. Server RPCs require active administrator or accountant profiles for mutations. Staff receive permitted read summaries only; viewers receive permitted read-only receipt/payment data; inactive profiles are blocked. No service-role key is used.

## Routes

- `/dashboard/payments`
- `/dashboard/payments/new`
- `/dashboard/payments/[id]`
- `/dashboard/receipts`
- `/dashboard/receipts/[id]`
- `/dashboard/receipts/[id]/print`
- `/dashboard/invoices/[id]` now exposes Record payment for eligible invoices.

Receipt printing uses the existing protected browser-print architecture and is labelled `Print / Save as PDF`; no PDF dependency was added.

## Storage status

The `payment-proofs` bucket is verified private with a 5 MB limit and PDF/JPEG/PNG MIME restrictions. Storage object policies allow only active administrators and accountants to insert, read, update or delete proof objects. Paths use payment UUIDs and no public URLs are generated. Proof upload is a separate protected action after payment creation; metadata is written only after upload succeeds, and failed metadata writes remove the uploaded file. A failed proof upload never reverses a valid payment.

## Tests

Passed:

- `npm run lint`
- `npm run typecheck`
- `npm run test:db` including Phase 3, Phase 4 and Phase 5 foundation suites
- `npm run test:smoke`
- `npm run build`
- Supabase security/performance review: no new security issue; performance remains clear. Existing warning: `app_private.calculate_document_totals` is marked immutable while using a stable expression.

The complete application suite passes locally. Final Preview deployment and manual QA remain before Phase 5 closeout.

## Manual QA

1. Record a full and partial payment against an issued invoice.
2. Confirm balances and payment states update correctly.
3. Confirm future dates, overpayments, draft invoices and cancelled invoices are rejected.
4. Reverse a payment and confirm balances, receipt status and activity update.
5. Confirm invoice cancellation is blocked while active payments exist.
6. Confirm payment and receipt numbering remains monotonic after prefix changes.
7. Test administrator, accountant, staff, viewer and inactive-profile access.
8. Test receipt print view at desktop and mobile widths.
9. Upload proof as administrator/accountant, verify authorised access, and confirm staff/viewer denial.

## Known limitations and next work

Payment-proof upload/storage policies and signed URL actions remain to be completed. Search/filter/pagination controls, richer receipt detail presentation, dashboard payment metrics, full automated payment edge-case fixtures and final Preview QA remain before Phase 5 closeout. Online gateways, automated delivery, refunds, credit notes, reports and land administration remain out of scope.

Recommended next work: finish private proof upload, add full payment/receipt UI coverage and tests, run advisors, deploy one final Preview, complete manual QA, then create `phase-5-complete` only after confirmation.
