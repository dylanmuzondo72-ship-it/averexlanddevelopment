# Phase 4 Handoff: Quotations and Invoicing

## Scope

Phase 4 adds protected quotations, quotation line items, draft and issued invoices, quote-to-invoice conversion, server-side financial calculations, activity logging, role-aware access, search, filtering, pagination, and branded A4 print views. Payments, receipts, PDFs, land administration, projects, reporting, and client portals remain out of scope.

## Migrations

- 20260724170114_phase_4_financial_documents.sql
- 20260724170120_phase_4_document_workflows.sql
- 20260724170125_phase_4_document_policy_hardening.sql
- 20260724180830_phase_4_role_hardening.sql

All migrations are applied to Supabase project iqakwzkaiyzzigjldwkh. Types were regenerated in lib/supabase/database.types.ts.

## Database Structures

New enums are quotation_status, invoice_status, document_item_type, discount_type, and document_tax_mode.

New tables are:

- quotations
- quotation_items
- invoices
- invoice_items
- app_private.document_counters

Documents retain client and company snapshots. Foreign keys use restrictive deletion behavior. Documents and line items have immutability triggers after sending or issuing. Hard deletion is blocked. lock_version is required for draft updates, transitions, and conversion updates.

## Numbering

The permanent internal counter keys are quotation and invoice. The configured quote_prefix and invoice_prefix only control formatted output. Prefix changes cannot reset or reuse a sequence.

Quotation numbers are assigned on the first successful draft save. Invoice numbers are assigned only when a draft invoice is issued. Abandoned and cancelled numbers are never reused.

## Financial Rules

PostgreSQL is authoritative. Quantity and unit price use four decimal places; rates and discount inputs use four decimal places; stored monetary totals use two decimal places.

The calculation order is line multiplication, line discount, line-net rounding, subtotal, document discount, proportional taxable/non-taxable discount allocation, exclusive tax addition or inclusive tax extraction, tax rounding, and grand total calculation.

## Workflows

Quotations support draft, sent, accepted, rejected, expired, cancelled, converted, and superseded states. Sent snapshots and items are immutable. Administrator-created revisions preserve the previous quotation and create a new editable draft revision.

Invoices support draft, issued, overdue as a derived display state, and cancelled. Issued snapshots, line items, totals, and payment-compatible fields are immutable. Cancellation requires a reason and preserves the record.

Accepted quotations can be converted once into a linked draft invoice in a transactional RPC. The quotation, client snapshot, company snapshot, line items, totals, and terms are preserved.

## Role Permissions

- Administrator: full Phase 4 quotation and invoice access, including revision, conversion, issue, cancellation, and document settings.
- Staff: permitted quotation creation/editing, sending, accepted/rejected outcomes, and print access. Staff cannot create, edit, issue, cancel, or change invoice financial values. Staff invoice reads are limited to assigned/created clients and owned/assigned quotations.
- Accountant: all quotation reads, direct draft invoice creation/editing, conversion, issue, cancellation, and print access. No staff-management access.
- Viewer: read-only quotation and invoice access, including print preparation where RLS permits.
- Inactive profiles: blocked by the existing active-profile checks.

Permissions are enforced by server actions, security-definer RPCs, direct-table RLS policies, and database constraints. Browser role values are not trusted.

## Routes

- /dashboard/quotes
- /dashboard/quotes/new
- /dashboard/quotes/[id]
- /dashboard/quotes/[id]/edit
- /dashboard/quotes/[id]/print
- /dashboard/invoices
- /dashboard/invoices/new
- /dashboard/invoices/[id]
- /dashboard/invoices/[id]/edit
- /dashboard/invoices/[id]/print

## Print Architecture

Print pages are protected server-rendered A4 views. The action is labelled Print / Save as PDF and opens the browser print dialog; the application does not claim to generate a direct downloadable PDF file. Multi-page views repeat document identity, include line-item pagination, totals, terms, signature space, slogan, and page numbers.

## Verification

- npm run lint: passed
- npm run typecheck: passed
- npm test: passed
- npm run test:db: passed, including Phase 3 and Phase 4 suites
- npm run test:smoke: passed
- npm run build: passed
- Supabase security advisor: one existing Auth warning, leaked-password protection disabled
- Supabase performance advisor: no issues

## Manual QA

Required manual checks before Phase 5:

1. Log in as administrator and create, edit, send, accept, revise, convert, issue, cancel, and print documents.
2. Confirm staff can manage only permitted quotations and can read/print only permitted invoices.
3. Confirm staff cannot create, edit, issue, or cancel invoices through direct requests.
4. Confirm accountant direct invoice creation, editing, issue, cancellation, and conversion.
5. Confirm viewer read-only access and print preparation.
6. Open two draft sessions and verify a stale lock_version shows a refresh conflict.
7. Verify prefix changes do not reset quotation or invoice sequences.
8. Verify mobile document forms, detail pages, tables, and print views do not overflow horizontally.
9. Use the browser print dialog and verify A4 page breaks, logo, totals, terms, signature area, footer slogan, and page numbers.
10. Confirm public pages, approved assets, WhatsApp links, login, logout, and Phase 3 clients remain unchanged.

## Preview and Commit

- Preview URL: https://averexlanddevelopment-rd98kz9vy.vercel.app
- Final implementation commit: 8ca94b7
- Handoff documentation commit: pending

## Known Limitations

- Browser print is the document output path; direct PDF generation is intentionally deferred.
- Payments, receipts, partial-payment allocation, and payment-proof storage are Phase 5 work.
- No automated email or WhatsApp API delivery is included.
- The Supabase Auth leaked-password protection advisor warning requires enabling the feature in the Supabase Auth settings.

## Recommended Phase 5

Implement payments, receipt numbering, private payment-proof storage, receipt print views, payment reversals, invoice balance updates, and payment-specific RLS without weakening the immutable issued-invoice history.
