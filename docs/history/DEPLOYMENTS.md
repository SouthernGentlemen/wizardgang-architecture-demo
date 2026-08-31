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
