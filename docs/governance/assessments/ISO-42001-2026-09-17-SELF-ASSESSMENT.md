# ISO/IEC 42001:2023 Self-Assessment — 2026-09-17

**Type:** Self-Assessment (owner/operator review; not an internal audit)
**Date:** 2026-09-17
**Reviewer function:** Management-System Owner
**Scope:** all 36 ISO/IEC 42001:2023 management-system clause records and all 38 Annex A controls in `assurance/compliance/iso-42001-2023.json`
**Assessment rubric:** `docs/governance/CONTROL-AND-DOCUMENT-INDEX.md` §13

## Method and boundary

This assessment follows `INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md` §4.2. The owner/operator reviewed the mapped governing sections, current structured assurance state, the dated MCP AI impact assessment, AI risk state, Codex and Claude supplier boundaries, implementation/validation evidence, and planned operating records. Independence is not claimed, so this record must not be described as a formal internal audit.

No operating record was created, backdated, simulated, or inferred. Planned competence, awareness, supplier, incident-exercise, management-review, and internal-audit activity remains Partial or Gap until it actually occurs. `assurance/evidence/evidence.json` and every existing `evidence` relationship were left unchanged.

## Results

| Population | Pass | Partial | Gap | N/A | Total |
|---|---:|---:|---:|---:|---:|
| Clauses | 0 | 33 | 3 | 0 | 36 |
| Annex A controls | 0 | 36 | 0 | 2 | 38 |
| **All records** | **0** | **69** | **3** | **2** | **74** |

## Material conclusions

- Clauses 9.2, 9.2.1, and 9.2.2 remain Gap because no sufficiently objective formal AIMS internal audit has been completed. This DEMO-288 record is only an owner/operator Self-Assessment.
- A.6.2.8 is reduced from Pass to Partial because implementation/source traceability alone does not demonstrate broader AI event/traceability effectiveness across a review interval.
- ST-051 records the DEMO-284 real MCP boundary tests for unknown methods, invalid namespaces, and prohibited write tools. A.6.2.4 and A.9.4 reference that register section, but remain Partial because the current matrix is intentionally narrow rather than a complete AI safety or misuse evaluation.
- A.7.2 and A.7.6 remain N/A because model training, fine-tuning, model-development datasets, and model-training data preparation are explicitly outside the current scope; both require reassessment before such activity is introduced.
- Codex and Claude remain the only approved AI/MCP provider/client families. Their responsibilities and limitations are documented separately, while recurring supplier-review evidence remains pending.

## Follow-up

The next posture change must be driven by actual implementation, validation, operating, supplier-review, management-review, audit, incident, impact-reassessment, or corrective-action evidence. This self-assessment does not claim ISO/IEC 42001 certification, formal conformance, or independent assurance.
