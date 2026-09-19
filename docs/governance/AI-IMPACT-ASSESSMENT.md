# AI Impact Assessment

**Reference:** WG-AIA-001
**Applies to:** WizardGang Architecture Demo Model Context Protocol (MCP) capability
**Status:** Approved current-state assessment
**Owner:** WizardGang
**Review due:** 2026-12-02, and earlier upon a mandatory reassessment trigger

## 1. Purpose

This document is the current impact assessment for the WizardGang Architecture Demo MCP capability. It evaluates reasonably foreseeable positive and adverse effects on direct users, indirectly affected parties, operators, evaluators, and downstream recipients of AI-assisted output.

The assessment method is informed by ISO/IEC 42001:2023 management-system requirements and ISO/IEC 42005:2025 guidance for AI system impact assessment. ISO/IEC 42005 is used here because it has direct methodological value for identifying affected parties, intended and foreseeable use, impacts, treatment, lifecycle review, and reassessment. This document does not reproduce ISO text and does not claim certification, formal conformance, independent assurance, or assessment of a third-party general-purpose model.

AI risk remains separately authoritative in `assurance/risks/risks.json`. This assessment focuses on effects on people and interested parties rather than duplicating the risk register.

## 2. System Being Assessed

The assessed capability is the public MCP interface implemented by the architecture demo.

The current server:

- exposes Streamable HTTP at `/mcp`;
- supports MCP protocol version `2026-07-28`, matching the checked-in server constant and the current official MCP specification at `https://modelcontextprotocol.io/specification/2026-07-28`;
- exposes the approved read-only tool inventory defined by `contracts/mcp/tools.json`;
- authorizes requests inside ordinary application authentication and authorization boundaries;
- validates namespaces and inputs server-side;
- bounds record retrieval and output size;
- records public-safe, bounded application evidence;
- rejects unsupported or invalid protocol behavior through the executable MCP handler;
- and exposes no MCP tool with application administration, deployment, source-control, privileged-data, destructive, or write authority.

The current boundary evaluation includes approved read behavior, unsupported methods, invalid namespaces, and prohibited write-tool behavior. These checks are evidence of the implemented boundary, not a complete safety claim.

## 3. What WizardGang Controls

WizardGang controls the application-side capability, including:

- which MCP tools exist and their schemas;
- application authorization and validation;
- data sources and fields exposed through tools;
- result limits and error behavior;
- server-side logging and evidence;
- source control, release, and deployment of the MCP implementation;
- public documentation and assurance claims;
- approved provider/client families;
- and whether future tools receive broader authority.

WizardGang does not control every external model's reasoning, prompting, memory, user interface, downstream actions, or interpretation of returned data. External model behavior cannot be relied upon as an application security or governance control.

## 4. Intended Use

The intended use is to let an MCP-compatible client inspect bounded public architecture-demo information and verify MCP interoperability through a controlled, read-only application interface.

Expected uses include:

- inspecting public demonstration records;
- testing MCP client interoperability;
- demonstrating shared application authorization boundaries;
- demonstrating bounded structured tool behavior;
- testing fail-closed behavior for unsupported or invalid requests;
- and enabling technical evaluation of the architecture through an agent-capable interface.

The capability is not intended to make consequential decisions about people, administer the system, modify source or production configuration, deploy releases, mutate application data, access private records, or grant unrestricted authority to an external agent.

## 5. Intended Users and Affected Parties

Direct users include developers testing MCP clients, technical evaluators, AI/MCP users invoking public tools, WizardGang operators validating the capability, and automated agents acting on behalf of a user through a compatible client.

Indirectly affected parties may include public visitors whose expectations are shaped by assurance claims, recipients of summaries generated from demo data, maintainers relying on evaluation evidence, security researchers reviewing the public boundary, and future users affected by any later expansion of authority.

The current capability has limited direct human-impact sensitivity because it exposes bounded public demonstration data and performs no consequential action. The impact is not zero: downstream misinterpretation, capability drift, data-boundary expansion, misleading assurance, or future authority expansion could materially change the profile.

## 6. Data Boundary

Current MCP inputs consist of protocol/client metadata and tool-specific arguments. Inputs are normalized and bounded before logging.

The tool boundary reads only data intentionally approved for public demonstration. Returned records may be synthetic, incomplete, stale, or context-limited. Availability through MCP is not a guarantee that a record is current, complete, authoritative, or suitable for consequential decision-making.

Credentials, authorization material, private account metadata, payment data, private reports, privileged logs, and other restricted information are outside the current public MCP boundary. A new data category or persistence path is a mandatory reassessment trigger.

## 7. Foreseeable Benefits and Misuse

Current positive effects include a safer demonstration of AI/tool integration, improved inspectability, bounded automation, traceable application-side behavior, and a low-friction interoperability target for developers.

Foreseeable misuse or misinterpretation includes:

- over-trusting demonstration data;
- treating returned content as instructions to an external model;
- attempting to use MCP as a path around application authorization;
- using downstream agent behavior to take actions outside WizardGang control;
- assuming client identity metadata is authentication;
- treating narrow boundary tests as proof of broad AI safety;
- assuming future tools inherit the current low-authority profile;
- and stripping provenance, limitation, or accessibility context in a third-party client.

These cases are addressed through server-side controls, explicit scope, bounded data, current documentation, testing, and mandatory reassessment before material authority or data expansion.

## 8. Human Oversight

Human oversight is exercised through control of the application and its release boundary rather than per-read approval.

WizardGang retains human authority over source changes, tool definitions, permissions, schemas, data exposure, provider approval, production configuration, release/deployment, risk acceptance, policy approval, and expansion of the MCP capability.

Per-request manual approval is not required for the current read-only public boundary. That model is acceptable only while the capability remains low-authority and non-destructive. Any tool that writes, deletes, administers, deploys, changes permissions, controls an external system, or creates another material consequence requires a new oversight decision before release.

## 9. Authority and Tool Boundary

The current server returns information and does not expose MCP tools that create, edit, or delete application records; change users or permissions; change provider configuration; dispatch releases; merge source changes; deploy code; or administer external systems.

Client metadata is informational and never grants authority. Tool annotations and external-client behavior are not trusted as substitutes for server-side authorization.

The read-only application boundary is the primary current impact-limiting control.

## 10. Treatment State

Current treatment is to:

- keep the MCP tool inventory controlled and reviewable;
- retain least-privilege, read-only authority;
- validate methods, namespaces, arguments, and data sources server-side;
- keep public/private data boundaries explicit;
- keep logs bounded and free of credentials and unsafe request bodies;
- exercise allowed and prohibited protocol paths in automated tests;
- retain supplier/client-family governance separately from authentication;
- communicate data-quality and downstream-use limitations;
- connect material AI concerns to incident, risk, supplier, and corrective-action processes;
- and require reassessment before material changes to authority, data, intended use, or affected parties.

Open treatment remains for periodic effectiveness review, changing external-client behavior, communication effectiveness, accessibility of third-party presentation, and any future authority expansion. No open treatment is represented here as completed without evidence.

## 11. Negative and Adverse Impact Assessment

The current adverse-impact set remains:

| Impact | Affected parties | Current boundary | Treatment direction |
| --- | --- | --- | --- |
| External AI over-trusts demo data | AI/MCP users and downstream recipients | Public demo data may be incomplete or stale | Preserve provenance/limitations and avoid consequential-use claims |
| Returned content influences a model as indirect instruction | AI/MCP users and operators | Returned data is not trusted instruction | Keep server authority independent of model interpretation |
| Public data boundary expands unintentionally | Users, operators, data subjects if scope changes | Restricted data is excluded | Require data review and reassessment before new categories |
| Capability expansion reduces human control | Operators and users | No write/admin/destructive tools | Require explicit oversight and impact reassessment before expansion |
| Narrow tests create false confidence | Evaluators and maintainers | Boundary tests are intentionally scoped | Keep assurance claims bounded and retain gaps/open treatments |
| Client identity metadata is misunderstood | Developers and operators | Metadata is informational only | Never use client naming as authentication or authorization |
| Protocol/client incompatibility causes confusing failures | Developers and MCP users | One explicit current protocol version | Keep protocol behavior explicit and fail closed |
| Third-party presentation loses accessibility or limitation context | Users and downstream recipients | External client UI is outside WizardGang control | Keep application output structured and publish limitations |
| Logging is excessive or insufficient | Users and operators | Logging is bounded and public-safe | Review logging after schema/authority changes |
| AI concerns are handled inconsistently | Users, operators, researchers | Existing incident/risk paths apply | Route material concerns through governed response processes |

For the current read-only public capability, residual direct human and organizational impact remains limited to moderate. This is not blanket risk acceptance; individual AI risks and treatments remain governed by structured risk records.

## 12. Standards and Protocol Baseline

- **ISO/IEC 42001:2023** is the current AI management-system baseline used for the repository's structured alignment records: `https://www.iso.org/standard/42001`.
- **ISO/IEC 42005:2025** provides the specific impact-assessment methodology used to strengthen this assessment: `https://www.iso.org/standard/42005`.
- **ISO/IEC 27001:2022 with Amendment 1:2024** remains the information-security management baseline for the surrounding application boundary. It informs security governance but is not treated as the impact-assessment method: `https://www.iso.org/standard/27001`.
- **Model Context Protocol specification 2026-07-28** is the current protocol authority and matches the server's declared supported version: `https://modelcontextprotocol.io/specification/2026-07-28`.

OpenAPI is not used as an AI impact-assessment methodology. The repository's executable HTTP API contract remains OpenAPI 3.1.0; the OpenAPI Initiative currently publishes 3.2.1, but changing the executable contract version is outside this assessment refactor.

## 13. Mandatory Reassessment Triggers

Reassess before release, or promptly after an unplanned event, when a material change affects:

- intended purpose or non-goals;
- direct or indirectly affected parties;
- data categories, persistence, or disclosure boundary;
- MCP tools, schemas, or protocol version;
- write, destructive, administrative, deployment, or external-system authority;
- approved AI/MCP provider or client family;
- application authorization or security assumptions;
- human oversight;
- foreseeable misuse or downstream behavior;
- a material AI/security/privacy/accessibility incident;
- or evidence that invalidates the current residual-impact conclusion.

A new capability does not inherit this assessment merely because it also uses MCP.

## 14. Review, Evidence, and Authority

Evidence for the current assessment is drawn from executable MCP source, `contracts/mcp/tools.json`, protocol/boundary tests, structured AI risks, supplier records, public-safe application evidence, controlled releases, and workflow results.

The review due date is **2026-12-02**. An earlier mandatory reassessment trigger takes precedence.

This document is the current human-readable impact-assessment authority. Structured risk, compliance, lifecycle, evidence, and supplier records remain authoritative for their respective current facts. Superseded assessment text is recovered from Git/GitHub history rather than retained as parallel current-state Markdown.
