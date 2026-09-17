# ISO/IEC 27001:2022 Self-Assessment — 2026-09-17

**Type:** Self-Assessment (owner/operator review; not an internal audit)
**Date:** 2026-09-17
**Reviewer function:** Management-System Owner
**Scope:** all 34 ISO/IEC 27001:2022 management-system clause records and all 93 Annex A controls in `assurance/compliance/iso-27001-2022.json`
**Amendment consideration:** ISO/IEC 27001:2022/Amd 1:2024 climate-change changes for clauses 4.1 and 4.2
**Assessment rubric:** `docs/governance/CONTROL-AND-DOCUMENT-INDEX.md` §13

## Method and boundary

This assessment follows `INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md` §4.2. The owner/operator reviewed the mapped governing sections, current structured assurance state, implementation/validation evidence, planned operating records, and the same-day GitHub repository control state. Independence is not claimed, so this record must not be described as a formal internal audit.

No operating record was created, backdated, simulated, or inferred. `AR-001`, `RT-001`, `EX-001`, `AW-001` through `AW-007`, and scheduled supplier reviews remain Planned/Partial until they actually occur. `assurance/evidence/evidence.json` and every existing `evidence` relationship were left unchanged.

## Results

| Population | Pass | Partial | Gap | N/A | Total |
|---|---:|---:|---:|---:|---:|
| Clauses | 0 | 31 | 3 | 0 | 34 |
| Annex A controls | 0 | 66 | 3 | 24 | 93 |
| **All records** | **0** | **97** | **6** | **24** | **127** |

## Material conclusions

- Clauses 4.1 and 4.2 now explicitly include the 2024 climate-change amendment considerations. No distinct climate-specific security issue or interested-party requirement is currently identified for this scoped public demo, but the determination remains subject to the documented review triggers and therefore remains Partial until operated.
- A.8.15, A.8.25, and A.8.32 were reduced from Pass to Partial because the current rubric requires current operating/effectiveness evidence; source implementation and process convention alone are insufficient.
- A.8.30 was changed from N/A to Partial. AI-assisted development and approved AI provider/client families are part of the actual engineering/supplier boundary, while the scheduled supplier review is still incomplete.
- Same-day GitHub API verification reports `main` unprotected, required-status-check enforcement off in branch metadata, no configured repository rulesets, 232 merged pull requests, and 0 merged pull requests matching the `review:approved` search qualifier. The direct classic protection-detail endpoint is unavailable to the connected integration, so no additional setting is inferred from that denied request.
- Clauses 9.2/9.2.1/9.2.2 and A.5.35 remain gaps because no sufficiently objective formal internal audit or independent security review has been completed. A.8.1 and A.8.34 remain gaps for missing managed-endpoint assurance and actual safeguarded audit-testing evidence.

## Follow-up

The next posture change must be driven by actual implementation, validation, operating, review, audit, or corrective-action evidence. This self-assessment does not claim ISO/IEC 27001 certification, formal conformance, or independent assurance.
