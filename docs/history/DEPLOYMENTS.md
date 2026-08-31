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
