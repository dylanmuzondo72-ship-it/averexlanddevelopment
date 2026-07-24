# Phase 3 Handoff

## Scope and safety

- Repository: `dylanmuzondo72-ship-it/averexlanddevelopment`
- Branch: `feature/averex-business-system`
- Phase 2 safety tag: `phase-2-complete`
- Production branch: `main` (unchanged and not merged)
- The approved public website, logo, favicon, realistic images, public routes,
  contact links and red/black/white branding were preserved.
- No fake clients, staff profiles or business activity were added.
- No Phase 4 land administration, quotation, invoice, payment, receipt or PDF
  features were started.
- No dependencies were installed, removed or updated during Phase 3.

## Database migrations

Supabase project: `iqakwzkaiyzzigjldwkh`

Applied migrations:

- `20260724142451_phase_3_dashboard_clients.sql`
- `20260724143107_phase_3_policy_hardening.sql`
- `20260724143512_phase_3_client_read_models.sql`
- `20260724174900_phase_3_client_audit_indexes.sql`

The migrations add:

- `client_type` and `client_status` enums.
- The `clients` table, UUID relationships, timestamps, archive fields, indexes
  and Row Level Security.
- `company_settings.client_prefix`, defaulting to `AVX-CL`.
- Database-side client references in the format `AVX-CL-0001`.
- Safe create, update, archive, restore, duplicate-check, search and detail RPCs.
- Role-checked staff, settings, activity and dashboard-overview RPCs.
- Client and profile activity logging.
- Administrator self-deactivation and final-active-administrator protection.
- Read models that expose staff display names without granting broad profile
  access.

Generated linked-project types are stored in
`lib/supabase/database.types.ts`.

## Roles and permissions

- **Administrator:** create, read and edit clients; archive and restore clients;
  manage existing staff profiles; edit company settings; view the full safe
  Phase 3 activity trail.
- **Staff:** create clients, read permitted client records and edit active
  assigned client records. Staff cannot archive clients or manage roles.
- **Accountant:** read clients, read company settings and view the restricted
  operational activity trail. No client or settings writes.
- **Viewer:** read clients only. No staff, settings or activity access.
- **Inactive profile:** blocked by server guards and database role helpers.

The browser does not submit or decide permissions. Server actions re-check the
authenticated profile, and database functions/RLS enforce the same boundaries.
Direct client writes and direct profile updates are revoked.

## Dashboard routes

- `/dashboard`
- `/dashboard/clients`
- `/dashboard/clients/new`
- `/dashboard/clients/[id]`
- `/dashboard/clients/[id]/edit`
- `/dashboard/staff`
- `/dashboard/settings`
- `/dashboard/activity`
- `/dashboard/profile`

The protected dashboard now includes a responsive sidebar/mobile drawer, active
navigation states, loading/error/empty states, a user summary and logout.
Future modules are labelled as coming later and are not interactive.

## Client management

- Search by name, reference, email or phone.
- Filter by client type and archive status.
- Sort and paginate database results.
- Create, view, edit, archive and restore without hard deletion.
- Duplicate email/phone warnings require explicit confirmation.
- Administrator assignment to active staff profiles.
- Staff-created clients are assigned to the creating staff member.
- Per-client activity history.
- Server-side validation and safe database error messages.

## Staff, settings and activity

- Administrators can edit existing profile names, phone numbers, roles and
  active/inactive status.
- Authentication email and password remain read-only; no Auth user invitation
  or deletion workflow was added.
- Company settings are administrator-editable and accountant-readable.
- Activity supports safe search, filters, date range and pagination.
- Accountants do not receive profile-management events or activity metadata.
- No service-role key is used by the application.

## Dashboard overview

Only live Phase 3 data is shown:

- Active clients.
- Archived clients.
- Active staff profiles.
- Clients created this month.
- Recent role-appropriate activity.
- Create-client shortcut for administrators and staff.

No revenue, invoice or other future-module statistics are displayed.

## Automated checks

Completed locally:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:db`
- `npm run test:smoke`
- `npm run build`

Phase 3 unit coverage includes role permissions, client validation and filter
parsing. Database tests cover administrator, staff, accountant, viewer and
inactive-role boundaries; client references; create/update/archive/restore;
activity logging; prohibited direct writes; and final-administrator guards.
Database fixtures are temporary and rolled back.

Public smoke tests cover every Phase 1 public route, the approved assets and the
logged-out dashboard redirect.

## Supabase advisors

- Database lint: no schema errors.
- Performance advisor: no missing-index findings after the audit foreign-key
  index migration. New-table indexes remain reported as unused until production
  query statistics accumulate.
- Security advisor: no Phase 3 schema-policy findings.
- Remaining project-level warning:
  `auth_leaked_password_protection` is disabled. Enable leaked-password
  protection in Supabase Auth settings after reviewing the project policy.

## Preview

- Stable feature-branch alias:
  `https://averexlanddevelopme-git-f538f0-dylanmuzondo72-ship-its-projects.vercel.app`
- A fresh Preview deployment is created from the final Phase 3 branch tip after
  all local checks pass.
- The closing Phase 3 commit SHA and deployment-specific URL are reported in the
  final delivery message.

## Manual QA required

Use the Preview deployment without sharing credentials:

1. Confirm administrator login, session refresh, logout and logged-out redirect.
2. Confirm the dashboard identifies Dylan Muzondo as Administrator.
3. Check the dashboard drawer at 390px, tablet layout at 768px and desktop at
   1440px.
4. Create a client only with verified business information, then test edit,
   archive and restore.
5. Confirm a duplicate phone or email produces a warning before saving.
6. Test staff, accountant and viewer permissions with dedicated non-production
   Auth accounts if those accounts are available.
7. Test inactive-profile blocking with a non-administrator account. Do not
   deactivate the current administrator.
8. Verify the final administrator cannot be demoted or deactivated.
9. Confirm accountant settings are read-only and administrator settings are
   editable before making any intentional real setting change.
10. Review client and profile changes in the activity page.

## Known limitations

- Phase 3 manages profiles that already exist; staff invitation, password and
  Auth-email administration remain manual in Supabase.
- Full role-by-role browser QA requires separate Auth accounts for each role.
- Preview and local environments use the linked Supabase project, so intentional
  settings or client changes affect that shared database.
- Leaked-password protection requires the manual Supabase Auth setting noted
  above.
- Phase 4 business modules have not started.
