# Phase 6 Handoff: Reporting and Business Intelligence

## Scope

Phase 6 adds protected operational reporting on `feature/averex-business-system` without changing the public website, payment workflows, or land administration. Reports read live Supabase data and show an honest empty state when the pre-launch database has no business records.

## Routes

- `/dashboard/reports`
- `/dashboard/reports/client-statements`
- `/dashboard/reports/client-statements/[clientId]`
- `/dashboard/reports/invoices`
- `/dashboard/reports/outstanding`
- `/dashboard/reports/overdue`
- `/dashboard/reports/payments`
- `/dashboard/reports/quotations`
- `/dashboard/reports/monthly-summary`
- `/dashboard/reports/activity`
- `/dashboard/reports/print`
- `/dashboard/reports/client-statements/[clientId]/print`

All routes require an active authenticated dashboard profile. Existing role and RLS rules remain authoritative; report queries do not use a service-role key. Activity reporting remains restricted to the existing administrator/accountant activity access policy.

## Reporting rules

- Issued invoices are used for invoiced and outstanding totals; drafts are excluded.
- Active payments are the revenue source. Reversed payments and receipts are not counted as additional revenue.
- Payment state, overdue balance, quotation status, client status, and activity are read from live records.
- Date ranges support today, week, month, last month, year, and custom periods.
- CSV exports include invoices, outstanding, overdue, payments, quotations, monthly summaries, and client statements.
- Protected browser print views are labelled `Print / Save as PDF`; no PDF dependency was added.

## Tests

Passed locally:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:db` (Phase 3, Phase 4 and Phase 5 suites)
- `npm run test:smoke`
- `npm run build`

The Phase 6 tests verify the route set, active-payment revenue rule, protected CSV entry point, and print routes. Credential-based role QA and one final Vercel Preview verification remain before production promotion.

## Known limitations

- Reporting currently reads bounded live result sets and does not add a new reporting warehouse or materialized views.
- Activity filtering retains the existing safe activity access boundary; no authentication secrets or private document contents are exposed.
- CSV and browser-print outputs are operational reports, not audited financial statements.

## Deployment

Migration: none required.
Feature branch: `feature/averex-business-system`.
Preview URL and final commit will be recorded after the grouped Phase 6 commit and Preview deployment.

## Manual QA checklist

1. Open every report route as administrator and accountant.
2. Confirm staff/viewer access matches their existing authorized read-only dashboard permissions.
3. Confirm inactive profiles are blocked.
4. Verify zero-data empty states and date-range changes.
5. Verify invoice payment states, overdue aging, and active-payment totals.
6. Download each CSV and check UTF-8, headers, dates, and totals.
7. Open print views at desktop and mobile widths and use the browser print dialog.
8. Confirm public pages, login, dashboard navigation, payments, receipts, and mobile navigation remain unchanged.
