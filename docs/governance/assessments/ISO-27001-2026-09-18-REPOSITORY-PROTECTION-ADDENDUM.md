# ISO/IEC 27001:2022 Repository-Protection Reassessment Addendum — 2026-09-18

**Type:** Focused self-assessment addendum (owner/operator review; not an internal audit)
**Date:** 2026-09-18
**Reviewer function:** Management-System Owner
**Scope:** ISO/IEC 27001:2022 controls A.8.25 and A.8.32 after the DEMO-300 GitHub provider change
**Assessment rubric:** `docs/governance/CONTROL-AND-DOCUMENT-INDEX.md` §13

## Trigger and boundary

DEMO-300 implemented the repository-protection treatment identified by the 2026-09-17 self-assessment. This addendum reassesses only A.8.25 and A.8.32 against the resulting live GitHub configuration. It does not replace or rewrite the 2026-09-17 full self-assessment, create an operating record, claim independent review, or claim ISO/IEC 27001 certification or conformance.

Every existing structured `evidence` relationship remains unchanged. The canonical control rationales, gaps, and documentation relationships are maintained in `assurance/compliance/iso-27001-2022.json`.

## Provider state and verification

The provider change began from a verified state with no repository rulesets, merge commits/squash/rebase all enabled, and automatic deletion of merged head branches disabled.

GitHub REST API responses obtained on 2026-09-18 at 08:22 UTC established the following resulting state:

| Surface | Verified state |
|---|---|
| `Protect main` | Active branch ruleset, provider ID `23647109`, applying to `refs/heads/main`, with no bypass actors |
| Main integrity | Deletion and non-fast-forward updates blocked |
| Pull-request gate | Pull request required; merge commits are the only allowed method; zero approving reviews required for the single-maintainer model |
| Required checks | `validate` and `change-id`; creation is not exempt; strict branch freshness is not required |
| `Protect release tags` | Active tag ruleset, provider ID `23647111`, applying to `refs/tags/v*`, with no bypass actors |
| Release-tag integrity | Update and deletion blocked |
| Repository merge settings | Merge commits enabled; squash and rebase merges disabled; merged head branches deleted automatically |

The verification queried the exact rulesets and repository settings without reading or recording any credential value:

```text
gh api repos/SouthernGentlemen/wizardgang-architecture-demo/rulesets/23647109
gh api repos/SouthernGentlemen/wizardgang-architecture-demo/rulesets/23647111
gh api repos/SouthernGentlemen/wizardgang-architecture-demo
```

## A.8.25 Secure development lifecycle

**Conclusion: Partial.** The lifecycle now has provider-enforced pull-request topology, required CI and controlled-change checks, protection against deletion/force push, and merge-commit-only integration. Requiring zero approving reviews is deliberate for the one-maintainer repository and does not imply that independent review occurred.

This implementation evidence closes the previously observed absence of provider enforcement. It does not yet demonstrate effectiveness over an operating interval. A later dated review must confirm that the ruleset remained active and gated representative changes before this control can be considered for Pass.

## A.8.32 Controlled technical changes

**Conclusion: Partial.** GitHub now enforces the repository's main-branch pull-request/check topology and protects published `v*` release tags from update or deletion. Repository settings also preserve merge-commit topology and remove merged head branches.

The configured state is verified, but a later dated effectiveness review must demonstrate that branch and tag protections remained active, rejected prohibited changes when exercised safely, and did not drift over an operating interval before this control can be considered for Pass.

## Follow-up

Retain a post-change effectiveness review after a meaningful operating interval. That review should compare the live rulesets and merge settings with CFG-013, examine representative accepted and rejected change paths, and record any correction or an explicit no-change conclusion. This addendum does not count the configuration action itself as that effectiveness review.
