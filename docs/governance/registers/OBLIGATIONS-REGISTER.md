# Obligations Register

**Reference:** WG-REG-010  
**Framework:** Integrated ISMS / AIMS external obligations  
**Status:** Proposed  
**Owner:** Management-System Owner  
**Assessment date:** 2026-09-02  
**Review due:** 2026-12-02 for initial operating review, then at least annually and after material jurisdiction, contract, supplier, data, incident, licensing, or public-claim change  
**Approval:** Controlled pull request and merge

## 1. Purpose

This register records known, voluntary, conditional, and unresolved legal, regulatory, contractual, intellectual-property, privacy, and related obligations for the WizardGang Architecture Demo.

It is intentionally conservative. An item being listed does not mean a law applies; it means the topic is controlled, assigned, and reviewed when its factual trigger exists.

The governing procedure is `docs/governance/LEGAL-CONTRACTUAL-IP-PRIVACY.md`.

## 2. Applicability States

- **Applicable** — known current obligation.
- **Conditional** — applies when the stated trigger occurs.
- **Voluntary / Internal** — adopted as an internal/standards commitment rather than asserted legal compulsion.
- **Needs determination** — applicability cannot yet be responsibly concluded.
- **N/A** — outside current scope with rationale.

Evidence status uses **Met / Partial / Gap / N/A** and does not represent certification.

## 3. Current Register

| ID | Obligation area | Source type | Applicability | Current evidence status | Owner | Current basis / remaining work |
|---|---|---|---|---|---|---|
| OBL-001 | Repository MIT License | License | Applicable | Met | Repository / Management-System Owner | Root `LICENSE` exists and identifies MIT terms. Preserve copyright + permission notice in copies/substantial portions as required. |
| OBL-002 | Third-party open-source dependency licenses | License | Applicable | Partial | Technical / Security Owner | npm dependencies and lockfile identify package set, but no consolidated third-party license/attribution review is retained yet. |
| OBL-003 | Contributor/source IP provenance | IP / internal | Applicable | Partial | Repository Owner | Controlled Git history identifies source changes; no separate contributor IP-attestation process is currently evidenced. |
| OBL-004 | Third-party images, logos, trademarks, copied text, demo content | IP / trademark / content | Conditional | Partial | Content / Management-System Owner | Use must have an appropriate basis; no complete third-party content-rights inventory is currently retained. |
| OBL-005 | GitHub service/account terms | Contractual/provider | Applicable | Partial | Supplier / Release Owner | GitHub is an approved Critical supplier. Account-specific terms are not published in the repo; recurring supplier/terms review pending. |
| OBL-006 | Cloudflare service/account terms | Contractual/provider | Applicable | Partial | Supplier / Operations Owner | Cloudflare is an approved Critical supplier. Service-specific obligations depend on actual enabled products/account terms; recurring review pending. |
| OBL-007 | OpenAI Codex service/provider terms | Contractual/provider | Applicable for approved use | Partial | AI Governance / Supplier Owner | Codex is approved only for current bounded AI/MCP use. Provider-account terms and changes require periodic review; no extra app privilege is granted. |
| OBL-008 | Anthropic Claude service/provider terms | Contractual/provider | Applicable for approved use | Partial | AI Governance / Supplier Owner | Claude is approved only for current bounded AI/MCP use. Provider-account terms and changes require periodic review; no extra app privilege is granted. |
| OBL-009 | Identity-provider terms | Contractual/provider | Conditional | Partial | Security / Supplier Owner | Provider remains Conditional until a specific identity scenario is configured; provider-specific obligations must be reviewed before activation. |
| OBL-010 | npm/package-registry terms and upstream package conditions | Contractual/license | Applicable | Partial | Technical / Security Owner | Controlled dependency use exists; unusual/restrictive license or source changes require review. |
| OBL-011 | Privacy/data-protection law applicability | Legal/regulatory | Needs determination | Gap | Management-System / Data Owner | Visitor/session features can contain name/email and other entered data. No blanket jurisdiction-specific privacy compliance claim is made. Determine based on users, geography, role, data, scale, and actual processing. |
| OBL-012 | Public privacy notice / transparency requirement | Legal/contractual/public commitment | Conditional | Gap | Management-System / Data Owner | No public privacy notice was identified in the current repository search. Determine if actual collection/retention/supplier/data-flow behavior creates a notice requirement. |
| OBL-013 | Data-subject/user request handling | Legal/privacy | Conditional | Gap | Management-System / Data Owner | No jurisdiction-specific request process is claimed. Establish if applicable privacy law or contract creates access/deletion/correction/other rights. |
| OBL-014 | Security incident / breach external notification | Legal/contractual | Conditional | Partial | Incident / Management-System Owner | Incident process requires notification decision, but actual recipients/deadlines depend on event, data, contract, and jurisdiction. No universal deadline invented. |
| OBL-015 | Regulatory / authority contact requirement | Legal/regulatory | Conditional | Partial | Management-System / Security Owner | Authority-contact criteria now exist; no fictional universal authority list. Identify actual authority only when applicable. |
| OBL-016 | Accessibility law / contract applicability | Legal/contractual | Needs determination | Partial | Accessibility / Management-System Owner | WCAG 2.2 is a voluntary alignment target. Legal accessibility applicability remains dependent on organization/service/contract/jurisdiction. |
| OBL-017 | WCAG 2.2 accessibility commitment | Voluntary / internal | Voluntary / Internal | Partial | Accessibility Owner | WCAG 2.2 evidence program exists, but complete manual conformance evidence remains incomplete and certification is not claimed. |
| OBL-018 | ISO/IEC 27001:2022 alignment commitment | Voluntary / internal | Voluntary / Internal | Partial | Management-System / Security Owner | Clauses 4–10 and Annex A SoA are governed as aligned — uncertified. Becomes contractual only if a future agreement expressly requires it. |
| OBL-019 | ISO/IEC 42001:2023 alignment commitment | Voluntary / internal | Voluntary / Internal | Partial | Management-System / AI Governance Owner | AIMS clauses/SoA/risk/impact controls are governed as aligned — uncertified. Becomes contractual only if expressly required. |
| OBL-020 | Records retention / deletion legal requirements | Legal/contractual | Needs determination | Partial | Data / Evidence Owner | Internal retention/deletion governance exists; no statutory period is asserted without a source. Review if law, contract, dispute, or investigation creates one. |
| OBL-021 | Legal hold / preservation duty | Legal | Conditional | Gap | Management-System Owner | No active hold is claimed. If triggered, suspend affected deletion/pruning and retain integrity while keeping sensitive legal material out of public evidence. |
| OBL-022 | Export, sanctions, restricted-party/service limitations | Legal/provider | Needs determination | Gap | Management-System / Supplier Owner | Public software/AI/provider use may create context-specific restrictions. No broad applicability determination is made; specialist review required if trigger arises. |
| OBL-023 | Customer/client security, AI, privacy, accessibility terms | Contractual | Conditional | N/A | Management-System Owner | No customer-specific contract is part of the current public-demo scope. Reassess immediately if the demo becomes part of a commercial/client engagement. |
| OBL-024 | Payment/commerce regulatory and contractual duties | Legal/contractual | N/A | N/A | Management-System Owner | Current demo does not establish a payment/commerce function in this management-system baseline. Reassess before adding payments, subscriptions, or paid user services. |
| OBL-025 | Sensitive/high-impact regulated data or decisions | Legal/regulatory | N/A | N/A | Data / AI Governance Owner | Current intended use excludes high-impact decisions and sensitive regulated-data processing. Any such expansion requires new scope, legal, risk, impact, data, supplier, and SoA review before release. |
| OBL-026 | Public security/compliance/privacy/AI claims | Public commitment / potentially legal | Applicable | Partial | Management-System / Evidence Owner | Claims must match evidence and preserve aligned/uncertified wording. Compliance registry/public-site rebuild will further strengthen traceability. |
| OBL-027 | Vulnerability researcher / testing authorization boundaries | Legal/security/internal | Conditional | Partial | Security Owner | Private vulnerability reporting guidance and acceptable-use boundaries exist. Authorization for intrusive testing of third-party/provider infrastructure is not implied. |
| OBL-028 | Provider/subprocessor/data-transfer requirements | Contractual/privacy | Conditional | Gap | Data / Supplier Owner | Determine if personal/confidential data is intentionally transferred to an external provider in a way that creates contractual/privacy requirements. Current public MCP boundary is limited to public demo records. |
| OBL-029 | Government/law-enforcement request handling | Legal | Conditional | Gap | Management-System Owner | No current request is claimed. If received, verify authority/scope, preserve required evidence, protect unnecessary data, and seek legal review as appropriate. |
| OBL-030 | Insurance notification/cooperation duties | Contractual | Conditional | N/A | Management-System Owner | No insurance-policy obligation is asserted in current scope. Reassess if a relevant policy covers the system/business. |

## 4. Immediate Action Items

The following are the highest-value unresolved obligations work items:

1. **Privacy applicability determination** — document whether the deployed demo's actual visitor/session collection, retention, geography, and supplier flows require a public privacy notice or request process.
2. **Third-party license inventory** — generate/review dependency licenses and retain required attribution/notice evidence where applicable.
3. **Third-party content inventory** — identify externally sourced images/logos/text/media and record the basis for public use where material.
4. **Provider terms review** — perform the first attributable review of GitHub, Cloudflare, Codex, and Claude terms relevant to actual services used.
5. **Incident notification decision template** — ensure incident records capture jurisdiction/contract/data trigger and notification decision without embedding unsupported deadlines.
6. **Legal-hold handling** — add a private-safe preservation decision record if a real hold/request/dispute ever occurs.

These are planned governance activities; they are not represented as completed by approval of this register.

## 5. Trigger Matrix

| Change / event | Minimum obligation review |
|---|---|
| New personal or sensitive data | OBL-011, 012, 013, 020, 028 + data/security/AI review as relevant |
| New geography/user population | OBL-011, 012, 013, 014, 015, 016, 022 |
| New GitHub/Cloudflare service | OBL-005/006 + supplier, data, risk, recovery review |
| Codex or Claude material terms/integration change | OBL-007/008 + supplier, AI risk, impact, SoA, data review |
| Third AI/MCP family | New obligation row + supplier/risk/impact/SoA approval before use |
| New dependency | OBL-002/010 + security-maintenance/license review |
| New third-party image/logo/text/media | OBL-004 |
| Security/privacy/AI incident | OBL-014/015/020/021/029 plus incident/corrective-action review |
| Commercial/client use | OBL-023 plus scope, contract, objectives, SoA and supplier review |
| Payments/subscriptions | OBL-024 plus new legal/security/data scope review |
| High-impact AI decision or regulated data | OBL-025 plus complete scope/risk/impact/legal reassessment |
| Stronger public compliance claim | OBL-017/018/019/026 + evidence/independent-assurance review |

## 6. Evidence Rules

- Keep sensitive contracts, account IDs, legal advice, privileged communications, recovery material, and credentials out of this public register.
- Public records may identify the obligation category, owner, applicability, status, and safe evidence reference.
- A provider's certification or terms do not prove WizardGang compliance.
- A policy/procedure does not prove operational performance.
- `Needs determination` is preferable to an unsupported yes/no legal conclusion.
- Any future legal conclusion should record source/date/reviewer and be reviewed when facts change.

## 7. Current Posture

The register now establishes a controlled method for external-obligation identification and distinguishes known current obligations from conditional or unresolved legal questions.

Current strongest evidence:

- MIT repository licensing;
- supplier inventory and provider boundaries;
- internal ISO/WCAG alignment commitments;
- data classification and incident decision processes;
- public-claim qualification as aligned — uncertified.

Current largest gaps:

- jurisdiction-specific privacy applicability and notice determination;
- third-party license/attribution inventory;
- third-party content-rights inventory;
- attributable provider-terms review;
- conditional legal-hold/export/regulatory procedures if triggered.

No broad legal-compliance or certification claim is made.