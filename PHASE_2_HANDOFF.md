# Phase 2 Handoff

## Database migrations

- Supabase project: `iqakwzkaiyzzigjldwkh`
- Applied migrations:
  - `20260723214717_phase_2_auth_foundation.sql`
  - `20260723214923_phase_2_auth_policy_hardening.sql`
- Tables created:
  - `profiles`
  - `company_settings`
  - `activity_logs`
- Row Level Security is enabled on all Phase 2 tables.
- Supabase security advisors reported no security lints after the policy hardening migration.

## Authentication architecture

- Supabase Auth is used for staff authentication.
- `@supabase/ssr` provides browser, server and middleware clients.
- Cookie-based session handling is implemented through root `middleware.ts`.
- `/dashboard` and `/dashboard/*` are protected and redirect logged-out users to `/login`.
- Login, logout, forgot-password, reset-password and auth callback routes are implemented.
- The middleware does not expose service-role credentials and does not rely on hidden UI controls for route protection.

## Environment variables

Configured locally and required in Vercel Preview/Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Vercel Preview variables were configured for:

- Environment: `Preview`
- Git branch: `feature/averex-business-system`

Values are intentionally not recorded in this document.

## Vercel Preview

- Stable branch alias:
  - `https://averexlanddevelopme-git-f538f0-dylanmuzondo72-ship-its-projects.vercel.app`
- Fresh Preview deployment after env setup:
  - `https://averexlanddevelopment-8yoxw3oaj.vercel.app`
- Temporary protected-preview access URL:
  - `https://averexlanddevelopment-8yoxw3oaj.vercel.app/?_vercel_share=aEE8o3QYJlSbSpoZWExfuNouyn9tlc6T`
- Vercel build logs confirmed:
  - `Detected Next.js version: 15.5.21`
  - App Router routes were generated.
  - Deployment reached `READY`.

## Routes created

- `/login`
- `/forgot-password`
- `/reset-password`
- `/auth/callback`
- `/auth/logout`
- `/dashboard`

## Administrator setup

- Auth user exists for `dylanmuzondo72@gmail.com`.
- Email is confirmed.
- Matching `public.profiles` row exists.
- `full_name`: `Dylan Muzondo`
- `role`: `administrator`
- `status`: `active`
- The user, credentials, UUID, role and status were not changed.

## Tests completed

Rerun after Vercel Preview environment-variable setup on 2026-07-24:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:smoke`
- `npm run build`
- Vercel Preview route checks:
  - `/` returned `200`.
  - `/about` returned `200`.
  - `/services` returned `200`.
  - `/available-land` returned `200`.
  - `/projects` returned `200`.
  - `/contact` returned `200`.
  - `/login` returned `200`.
  - `/dashboard` redirected to `/login?next=%2Fdashboard` for logged-out users.
  - Approved logo and hero image assets returned `200`.

## Known limitations

- Manual credential-based authentication QA is still required in the browser:
  - invalid login error
  - successful login redirect to `/dashboard`
  - dashboard identity display
  - session persistence after refresh
  - logout and protected-route redirect after logout
- Supabase Auth redirect URL allow-list should be reviewed when additional Preview aliases are used.
- Phase 2 only establishes auth, profile/settings/activity foundations and a dashboard shell. Business modules begin in later phases.

## Latest commit

- Latest Phase 2 implementation commit before this handoff document:
  - `5118b21 fix: keep preview auth routes resilient`

## Recommended Phase 3 work

- Build the dashboard shell into a fuller role-aware layout.
- Add server-side role checks for planned operational modules.
- Add user-management screens for administrators.
- Add dashboard loading, error and empty states for each protected section.
- Add activity logging hooks around authenticated staff actions.
- Keep public website routes visually stable while dashboard work proceeds.
