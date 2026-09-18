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

---

## DEP-DEMO-008

**Product:** WizardGang Architecture Demo

**Release:** v0.7.0

**Commit:** `79c0d8784966b5d3751774d8fc8dc19d22349bef`

**Environment:** production

**Date:** 2026-09-01

**URL:** https://demo.wizardgang.ai

**Changes:** DEMO-050 through DEMO-052

**Validation:** PASS — annotated-tag reproduction, GitHub Release publication, controlled-history validation, 77 tests across 17 files, generated 17-route HTML registry and 61-entry full contract, typecheck, contract/six-locale/security checks, dependency audit with no vulnerabilities, 3,577.54 KiB compressed production build, remote application of migration `0009_crawler_control.sql`, exact live `/version` identity, operational Worker/D1/R2/Durable Object health, dashboard-visible disabled crawler state and authenticated controls, dynamic `/robots.txt` disabled policy, live `403` enforcement for `OAI-SearchBot` and `ChatGPT-User` while disabled, independent `GPTBot` training-block response, `401` rejection of an unauthenticated toggle attempt, and live browser verification with no warnings.

**Previous:** v0.6.0

**Rollback:** Deploy v0.6.0.

**Note:** GitHub Release workflow 33552987927 completed end to end, including exact-tag validation, GitHub Release publication, production D1 migration, tagged Worker deployment, and automated public identity verification. Independent API and in-app browser verification confirmed that crawler access remained disabled by default after deployment, ordinary public access remained available, and the training crawler stayed blocked independently.

---

## Retrospective release deployment history — v0.8.0 through v0.23.0

**Retrospective:** This table was reconstructed only from annotated release tags and GitHub Actions Release workflow records. No further post-deployment verification was recorded for these releases.

| Tag | Tagged commit | Release workflow run | Deploy job conclusion |
|---|---|---:|---|
| v0.8.0 | `9915778531cf01e3ebe91926cedebde2ba777528` | 33654426812 | success |
| v0.9.0 | `550adf937954f5588e3b1bf1930a73c71e60b015` | 33658608933 | success |
| v0.10.0 | `e2b7f23bd98db583fbf0573c036098af61f4527c` | 33692122177 | success |
| v0.11.0 | `1e59c01361c1b51efbf94df27d7b866d02595678` | 33693009261 | success |
| v0.12.0 | `a240a1c4d2c5e37b2c521f6a89c912fdb18c1f30` | missing | missing |
| v0.13.0 | `e3d7783248aceb0208bb9fc1f9cc6b23c6750e6c` | missing | missing |
| v0.14.0 | `88bdef4b5bb8a937e894601d48afa40beb81940a` | 34162808235 — failure | failure |
| v0.14.1 | `5b5df3fd00199af79d38c3d32d95ab7a992900f5` | 34163644620 | success |
| v0.14.2 | `bbebfd73f9b37015d5f16f6812bcff30165ee567` | 34165425781 | success |
| v0.15.0 | `c3203e5dedf50850e070a85af00ad9d797032290` | 34254219896 | success |
| v0.15.1 | `5afb15dfdc3d44c84394026d2fc9ce0e245c3e1f` | 34255818252 — failure | failure |
| v0.16.0 | `e0da9a4f6c93c5f12aa314e3dd1b88d5899e5099` | 34299797738 | success |
| v0.16.1 | `3f2f8b972d3b331b16d51400865abd37839b7032` | 34301556624 | success |
| v0.16.2 | `c24678b35342bd3f358bdb4dc127f3043856c43a` | 34302980802 | success |
| v0.16.3 | `ce0b0c82be345ef43c89fbcc8c09d80a5bd6d5ce` | 34304287631 | success |
| v0.16.4 | `903bb606c057344cd828d163b9844b2778b30c73` | 34306046954 | success |
| v0.16.5 | `2c7656d5b0aee815a90ecb9446116be37d221dbd` | 34308060397 | success |
| v0.16.6 | `00fd6c5b3ac3166d2f84d929c509a325fe4db74e` | 34309066259 | success |
| v0.16.7 | `b9229b46a5c54dd339c4fdd4070cd9a33a75ae0e` | 34361093720 | success |
| v0.16.8 | `65a97d1f9fc6ac3f2a1f96046ee2416dc9176969` | 34364351459 | success |
| v0.16.9 | `1c10867c678a7f9800ab9fe36c423ec0f2727b78` | 34366438280 | success |
| v0.17.0 | `c96b42f8fdb0b20c1ed9ba19ba2e6c2d9984f243` | 34386876281 | success |
| v0.18.0 | `735545a4d41767eae04a5e8a02f270bb8edcc910` | 34427262749 | success |
| v0.19.0 | `cb26e3dfd421ba3c2b411e70d46ef7c92ae951fd` | 34548457050 | success |
| v0.20.0 | `12d5824de9eb98c71f8d5fb036f419b16b7337e3` | 34915915815 | success |
| v0.21.0 | `38b23d94f43c55705701174b575d07a5fc0e6028` | 34941650271 | success |
| v0.22.0 | `39ed5395033fba145b8706af5d42453e784a6068` | 35047541516 | success |
| v0.23.0 | `b617ed00eea87654a7cd8aac6fbde68da5394e77` | 35134211015 | success |

---

## DEP-DEMO-009

**Product:** WizardGang Architecture Demo

**Release:** v0.24.0

**Commit:** `7a7fcda1c058540c82c888f5cd1489de153b68e9`

**Environment:** production

**Date:** 2026-09-17

**URL:** https://demo.wizardgang.ai

**Changes:** DEMO-282 through DEMO-293

**Validation:** PASS — Release workflow 35296310582 completed successfully for annotated tag v0.24.0. The reproduce job (105449447121) succeeded, the deploy job (105449911434) succeeded, the GitHub Release was published with `registry-v0.24.0.json`, and migration 0013 was applied to production D1. Before the tag push, `IDENTITY_AUDIT_HMAC_SECRET` was provisioned with a generated 64-character value. Post-deployment verification confirmed version 0.24.0 at commit `7a7fcda` with the Worker operational; `/`, `/security`, `/demos`, and `/assurance` returned 200 in English and Arabic; `/operations` returned 404 without a `Location` header; `/api/demos/d1` exposed no localization placeholder in any of the six locales and showed email addresses in Arabic; the recorded assurance presentation cases resolved as expected with links pinned to `7a7fcda`; the retired governance laboratory paths returned ordinary 404 responses; identity logs returned 31 entries with no detail; and `/auth/session` still reported Microsoft Entra ID, Google, and GitHub configured.

**Previous:** v0.23.0

**Rollback:** Deploy v0.23.0.

**Note:** Annotated tag v0.24.0 was created at 2026-09-17 21:40:54 −04:00. Release run 35296310582 ran from 2026-09-18 01:40:57 UTC through 01:45:53 UTC; its reproduce job ran 01:40:59–01:43:18 UTC and its deploy job ran 01:43:23–01:45:52 UTC.
