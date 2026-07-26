# Phase 4 Final Handoff: Quotations and Invoicing

## Scope

Phase 4 delivers protected quotation and invoicing workflows. It includes quotation line items, status transitions, revisions, direct draft invoice creation, quote-to-invoice conversion, database-authoritative calculations, concurrency-safe numbering, client/company snapshots, role-based permissions, activity logging, search/filter/sort/pagination, and responsive branded A4 print views.

Out of scope: payments, receipts, payment-proof storage, financial reports, land administration, public listing management, client portals, and automated email or WhatsApp delivery.

## Repository and deployment

- Repository: `dylanmuzondo72-ship-it/averexlanddevelopment`
- Branch: `feature/averex-business-system`
- Production branch: `main` remains untouched and unmerged.
- Supabase project: `iqakwzkaiyzzigjldwkh`
- Latest branch commit: `a42595770dab74d67a4950448e8d7932dc4db86a`
- Canonical Preview: https://averexlanddevelopment-feature-averex-business-system.vercel.app
- The canonical alias points to the fresh route-layout deployment for the latest implementation commit.

## Migrations and database structures

Applied migrations:

- `20260724170114_phase_4_financial_documents.sql`
- `20260724170120_phase_4_document_workflows.sql`
- `20260724170125_phase_4_document_policy_hardening.sql`
- `20260724180830_phase_4_role_hardening.sql`

Phase 4 adds `quotations`, `quotation_items`, `invoices`, `invoice_items`, and private `app_private.document_counters`. Enums include `quotation_status`, `invoice_status`, `document_item_type`, `discount_type`, and `document_tax_mode`. Documents contain UUID relationships, snapshots, timestamps, restrictive foreign keys, indexes, lock versions, and activity relationships.

RLS and database functions enforce active-profile checks, role permissions, permitted invoice visibility, immutable sent/issued content, no hard deletion, lock-version checks, transactional conversion, and duplicate-conversion prevention. No fake financial records were added and no service-role key is exposed.

## Financial rules and numbering

PostgreSQL is authoritative. Quantities and unit prices use four decimals, rates use four decimals, and stored currency totals use two decimals. Calculation order is line multiplication, line discount, line-net rounding, subtotal, document discount, proportional taxable/non-taxable discount allocation, exclusive tax addition or inclusive tax extraction, tax rounding, then grand total.

Permanent counter keys are `quotation` and `invoice`; editable prefixes only affect formatted output. Quotation numbers are assigned on the first successful draft save and are never reused. Invoice numbers are assigned only when issued.

Draft updates, status transitions, issue actions and conversion require the loaded `lock_version`; stale updates are rejected with a refresh conflict. Sent quotation snapshots/items and issued invoice snapshots/items/totals are immutable. Revisions preserve the prior quotation. Cancelled records remain preserved.

## Workflows

Quotations support draft, sent, accepted, rejected, expired, cancelled, converted and superseded states. Accepted quotations can be converted once into a linked draft invoice through a transactional database function.

Invoices support draft, issued, derived overdue and cancelled states. Direct draft invoices are supported for permitted roles. Issuing assigns the invoice number and freezes financial content. Conversion copies client, project/listing references, snapshots, line items, discounts, tax, deposit and terms while preserving the relationship.

## Role permissions

- Administrator: full quotation/invoice access, revisions, conversion, issue, cancellation and document settings.
- Staff: permitted quotation work and print access; read/print only permitted invoices. Staff cannot create, edit, issue, cancel or change invoice financial values.
- Accountant: quotation reads plus permitted direct invoice creation, editing, conversion, issue, cancellation and print access.
- Viewer: read-only quotation/invoice access and permitted print preparation.
- Inactive profiles: blocked by server guards and RLS.

Permissions are enforced in server actions, protected RPCs, RLS and database constraints; browser role values are never trusted.

## Routes and navigation

Dashboard navigation includes Overview, Clients, Quotations, Invoices, Staff, Company Settings, Activity and My Profile, with later modules still non-interactive.

Quotation routes:

- `/dashboard/quotes`
- `/dashboard/quotes/new`
- `/dashboard/quotes/[id]`
- `/dashboard/quotes/[id]/edit`
- `/dashboard/quotes/[id]/print`

Invoice routes:

- `/dashboard/invoices`
- `/dashboard/invoices/new`
- `/dashboard/invoices/[id]`
- `/dashboard/invoices/[id]/edit`
- `/dashboard/invoices/[id]/print`

## Layout separation

- `app/layout.tsx` contains only document structure, metadata and global CSS.
- `app/(public)/layout.tsx` owns the public Header, Footer and WhatsApp float.
- `app/(auth)/layout.tsx` isolates login, forgot-password and reset-password pages and resets scroll to the top.
- `app/dashboard/layout.tsx` owns protected dashboard navigation, user summary and logout.
- Public chrome is absent from auth and dashboard routes. Staff Portal remains `/login` from desktop and mobile navigation.

## Print architecture

Protected server-rendered A4 quotation and invoice print routes use the action label `Print / Save as PDF` and the browser print dialog. The application does not claim to create a direct downloadable PDF. Views include Averex branding, document identity, client/company information, line items, totals, terms, signature space, slogan and page numbers.

## Verification

Passed locally:

- `npm run lint`
- `npm run typecheck`
- `npm test` - 18 tests passed
- `npm run test:db` - Phase 3 security/final-admin and Phase 4 calculation/workflow suites passed
- `npm run test:smoke` - public routes, assets, layout separation, 404 and dashboard redirect passed
- `npm run build` - Next.js production build passed

Preview verification passed for public routes, auth routes, protected Phase 4 routes, route redirects, public chrome retention and auth chrome absence. The canonical Preview is the feature-branch alias above. Mobile visual/manual QA remains part of the checklist below.

## Supabase advisors

Previously confirmed findings remain: performance advisor reported no issues; security advisor reported one existing project-level warning, `auth_leaked_password_protection` disabled. A fresh local `supabase db lint --linked` attempt during closeout failed before analysis with `LegacyDbConfigLoginRoleNetworkError` while initializing the login role, so no new advisor result is claimed. No policies were changed.

## Manual QA checklist before Phase 5

1. Create a quotation with at least two line items, save draft, edit, send, accept, convert once, and open its print view.
2. Create a direct invoice, save/edit draft, confirm totals, issue it, confirm numbering, verify issued financial fields cannot be edited, and open `Print / Save as PDF`.
3. Confirm duplicate quote conversion is rejected and activities are logged.
4. Confirm staff, accountant and viewer permissions using appropriate accounts.
5. Open two draft sessions and confirm stale `lock_version` updates show a refresh conflict.
6. Confirm prefix changes do not reset quotation or invoice sequences.
7. Test quotation/invoice forms, tables, print views and dashboard navigation at mobile widths.
8. Confirm Staff Portal works from every public page and auth/dashboard routes have no public footer or WhatsApp button.
9. Confirm the approved public website, images, contact links and responsive layout remain unchanged.

## Known limitations and Phase 5 recommendation

Browser printing is the document output path; direct PDF generation is intentionally deferred. Payments, partial payments, receipt numbering/printing, private payment-proof storage, payment reversals, invoice balance recalculation and payment-specific RLS are recommended for Phase 5. Supabase leaked-password protection still requires enabling the project setting manually.
