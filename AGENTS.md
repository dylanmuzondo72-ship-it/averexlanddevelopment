# Averex Land Solutions Project Rules

## Git and Deployment Safety

- Production is live. Do not work directly on the production branch.
- Vercel production deployments are tracked from `main`; all feature work for this build must stay on `feature/averex-business-system`.
- Never commit directly to `main`, never merge into `main`, and never push Phase 1 work anywhere except `feature/averex-business-system`.
- Use Vercel Preview Deployments for testing before any production deployment.

## Public Website Preservation

- The approved public website must remain available at `/`.
- Preserve the existing Averex logo, favicon, realistic images, red/black/white branding, WhatsApp links, email links, telephone links, Google Maps integration, responsive layout, and public sections.
- Approved image assets must remain available under `/assets/images/` and be stored in `public/assets/images/` without renaming.
- Do not replace the site with a generic SaaS dashboard, purple gradients, cartoon illustrations, unrelated stock imagery, or finance-dashboard branding.
- Do not present generated or representative images as completed Averex projects.

## Company Information

- Use central company settings for reusable business details.
- Company name: Averex Land Solutions.
- CEO: B. Mungofa.
- Primary phone: +263 774 041 144.
- Alternative phone: +263 717 515 513.
- Primary email: averexls@gmail.com.
- Alternative email: brynermungofa@gmail.com.
- Address: Lot 18 Doornfontein, 24km peg Harare-Bulawayo Road, Harare, Zimbabwe.
- Slogan: Enhance Your True Land Value.

## Business Claims

- Present Averex as an integrated land, property, planning, surveying coordination, development, and construction-services company.
- Do not claim Averex is legally licensed, registered, certified, or professionally accredited unless verified evidence is added to the repository.
- Use cautious wording where regulated work may be involved, such as: "Averex coordinates qualified professionals across surveying, planning, architecture, engineering and construction according to the requirements of each project."
- Do not guarantee title, approvals, ownership, land availability, regulatory outcomes, or project completion results.

## Phase Boundaries

- Phase 1 covers the public website only.
- Supabase authentication, database-backed listings, storage buckets, dashboard records, financial modules, PDFs, reports, and settings management belong to later phases.
- Available Land in Phase 1 must be data-ready but use a verified empty state until real published listings exist.
