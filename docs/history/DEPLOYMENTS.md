# Deployment records

Each record ties one production deployment to one annotated release tag. A deployment is complete only after the public `/version` response matches the release version and commit and `/health` reports the Worker operational.

## DEP-DEMO-001

**Product:** WizardGang Architecture Demo

**Release:** v0.1.0

**Commit:** `9d6efb8841fe450d9ee094224d33eb529a460b06`

**Environment:** production

**Date:** 2026-08-31

**URL:** https://demo.wizardgang.ai

**Changes:** DEMO-001 through DEMO-011

**Validation:** Exact-tag CI reproduction plus live `/version` and `/health` identity checks.

**Previous:** none — first public release

**Rollback:** none — first public release

---

## DEP-DEMO-002

**Product:** WizardGang Architecture Demo

**Release:** v0.2.0

**Commit:** `a90ae1801b0e65ef827c0770540a228e53cae7d2`

**Environment:** production

**Date:** 2026-08-31

**URL:** https://demo.wizardgang.ai

**Changes:** DEMO-012 through DEMO-019

**Validation:** PASS — annotated-tag reproduction, controlled-history validation, 49 tests across 12 files, typecheck, contract/locale/security checks, dependency audit, production build, migration 0006, exact live `/version` identity, operational `/health`, registry sitemap, eight seeded public records, and state-accurate maintenance behavior.

**Previous:** v0.1.0

**Rollback:** Deploy v0.1.0.

**Note:** The GitHub release workflow reproduced and published the exact tag. Its deployment job could not authenticate because the repository Cloudflare API token is invalid; the exact tag was deployed and verified through the authorized local Wrangler OAuth session. Rotate the repository token before the next automated deployment.

---

## DEP-DEMO-003

**Product:** WizardGang Architecture Demo

**Release:** v0.3.0

**Commit:** `cd03515a37c8098bd164c748cb8e804f7d50614d`

**Environment:** production

**Date:** 2026-08-31

**URL:** https://demo.wizardgang.ai

**Changes:** DEMO-020 through DEMO-028

**Validation:** PASS — annotated-tag reproduction, GitHub Release publication, controlled-history validation, 58 tests across 12 files, generated 17-route HTML registry and 45-entry full contract, typecheck, contract/locale/security checks, dependency audit, production build, remote migration 0007, exact live `/version` identity, operational `/health`, all 17 exact redirects and destination anchors, five index groups, 18-location sitemap without retired pages, and preserved SAML metadata XML.

**Previous:** v0.2.0

**Rollback:** Deploy v0.2.0.

**Note:** The tag-triggered GitHub release and deployment workflow completed end to end, including remote migration, tagged Worker deployment, and public identity verification.

---

## DEP-DEMO-004

**Product:** WizardGang Architecture Demo

**Release:** v0.4.0

**Commit:** `16803d69c241d57c9bf051037cd8c82019b54c9e`

**Environment:** production

**Date:** 2026-08-31

**URL:** https://demo.wizardgang.ai

**Changes:** DEMO-029 through DEMO-031

**Validation:** PASS — annotated-tag reproduction, GitHub Release publication, controlled-history validation, 58 tests across 12 files, typecheck, contract/locale/security checks, dependency audit, production build, remote confirmation that no D1 migrations were pending, exact live `/version` identity, operational `/health`, six Swagger-generated runnable operations on `/api`, and served Swagger 2.0 contract version 1.1.0.

**Previous:** v0.3.0

**Rollback:** Deploy v0.3.0.

**Note:** The tag-triggered GitHub release and deployment workflow completed end to end, including exact-tag validation, remote migration check, tagged Worker deployment, automated public identity verification, and an independent post-deploy check of the API explorer and contract.

---

## DEP-DEMO-005

**Product:** WizardGang Architecture Demo

**Release:** v0.4.1

**Commit:** `4cbc6fdd0be5f756ab7f4133616a9f13d36df52f`

**Environment:** production

**Date:** 2026-09-01

**URL:** https://demo.wizardgang.ai

**Changes:** DEMO-032 through DEMO-034

**Validation:** PASS — annotated-tag reproduction, GitHub Release publication, controlled-history validation, 58 tests across 12 files, typecheck, contract/locale/security checks, dependency audit, production build, remote confirmation that no D1 migrations were pending, exact live `/version` identity, operational Worker/D1/R2/Durable Object health, six collapsed Swagger-generated operations on `/api`, successful generated public GET execution, absence of removed filler and idle response text, no page-level horizontal overflow, and served Swagger 2.0 contract version 1.1.0.

**Previous:** v0.4.0

**Rollback:** Deploy v0.4.0.

**Note:** GitHub Release workflow 33516080109 completed end to end, including exact-tag validation, remote migration check, tagged Worker deployment, automated public identity verification, and independent post-deploy API interaction and visual inspection.

---

## DEP-DEMO-006

**Product:** WizardGang Architecture Demo

**Release:** v0.5.0

**Commit:** `a6438a2ec361a36311958ece1b5cb12b5e1242fd`

**Environment:** production

**Date:** 2026-09-01

**URL:** https://demo.wizardgang.ai

**Changes:** DEMO-035 through DEMO-045

**Validation:** PASS — annotated-tag reproduction, GitHub Release publication, controlled-history validation, 74 tests across 17 files, generated 17-route HTML registry and 59-entry full contract, six synchronized locales with 27 keys, typecheck, contract/security checks, dependency audit with no vulnerabilities, 2,725.27 KiB compressed production build, remote migration `0008_interactive_demo.sql`, exact live `/version` identity, operational Worker/D1/R2/Durable Object health, Japanese and Arabic localization, accessible and intentionally broken comparison modes, same-origin GraphiQL with schema documentation, eight public GraphQL records, three visitor-scoped D1 seed users, live GitHub release/commit/Actions evidence, a real R2 upload/preview/delete/reset lifecycle, and visitor webhook delivery/list/reset lifecycle.

**Previous:** v0.4.1

**Rollback:** Deploy v0.4.1.

**Note:** GitHub Release workflow 33531585459 completed end to end, including exact-tag validation, remote migration, tagged Worker deployment, and automated public identity checks. Independent API and in-app browser verification confirmed the interactive laboratories and removed all temporary R2 and visitor webhook test state. GitHub branch-protection controls remain explicitly unverifiable without the optional managed read token.

---

## DEP-DEMO-007

**Product:** WizardGang Architecture Demo

**Release:** v0.6.0

**Commit:** `af1b52aac2f04bba8f09b5513fee9b15bd2e63c1`

**Environment:** production

**Date:** 2026-09-01

**URL:** https://demo.wizardgang.ai

**Changes:** DEMO-046 through DEMO-049

**Validation:** PASS — annotated-tag reproduction, GitHub Release publication, controlled-history validation, 74 tests across 17 files, generated 17-route HTML registry and 60-entry full contract, typecheck, contract/six-locale/security checks, dependency audit with no vulnerabilities, 3,575.65 KiB compressed production build, remote confirmation that no D1 migrations were pending, exact live `/version` identity, operational Worker/D1/R2/Durable Object health, branded dark and light themes, representative dense API-route rendering, 390 × 844 responsive rendering, no observed horizontal overflow, exact live WizardGang color tokens, 17 architecture cards, and a cacheable 1200 × 630 social preview image.

**Previous:** v0.5.0

**Rollback:** Deploy v0.5.0.

**Note:** GitHub Release workflow 33549894035 completed end to end, including exact-tag validation, GitHub Release publication, remote migration check, tagged Worker deployment, and automated public identity verification. Independent in-app browser and API verification confirmed the WizardGang wordmark, editorial hierarchy, dark palette, full route map, operational live health state, social metadata, social image response, and viewport-width containment.
