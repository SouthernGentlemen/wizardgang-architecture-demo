# Implementation plan

The route contract is scaffolded first. Each architecture demo can then be made real in an isolated, reviewable change without renaming or reorganizing the public site.

Recommended order:

1. `[DEMO-001] FEAT` Route registry, shell, direct source links, D1 baseline.
2. `[DEMO-002] DB` D1 CRUD demonstration.
3. `[DEMO-003] OPS` Edge request/routing/security metadata demonstration.
4. `[DEMO-004] FEAT` Worker stateless compute demonstration.
5. `[DEMO-005] FEAT` R2 object + D1 metadata demonstration.
6. `[DEMO-006] FEAT` Durable Object coordinated counter/session demonstration.
7. `[DEMO-007] API` REST/JSON v1 API.
8. `[DEMO-008] API` OpenAPI/Swagger 2.x contract.
9. `[DEMO-009] API` GraphQL endpoint and resolver authorization boundary.
10. `[DEMO-010] API` Webhook receipt/delivery demonstration.
11. `[DEMO-011] SEC` OAuth 2.0 demonstration.
12. `[DEMO-012] SEC` SSO/SAML demonstration scaffolds with provider-neutral configuration.
13. `[DEMO-013] AI` MCP tools operating against authorized demo data.
14. `[DEMO-014] I18N` Locale switching, formatting, pluralization, and RTL demonstration.
15. `[DEMO-015] A11Y` WCAG 2.2 interaction/accessibility demonstration.
16. `[DEMO-016] OPS` Git/branch/release/Actions live evidence links.
17. `[DEMO-017] SEC` ISO/IEC 27001-aligned evidence surface.
18. `[DEMO-018] AI` ISO/IEC 42001-aligned AI evaluation/fallback evidence surface.
19. `[DEMO-019] DOCS` End-to-end traceability and evidence index.
20. `[DEMO-020] OPS` Operations dashboard composition and version/status links.
21. `[DEMO-021] OPS` Uptime and health history.
22. `[DEMO-022] OPS` Public-safe D1 log viewer with filtering/redaction.
23. `[DEMO-023] OPS` Synthetic billing, thresholds, and degradation behavior.
24. `[DEMO-024] SEC` Protected admin online/offline control and maintenance behavior.

Do not claim certification. These routes demonstrate engineering controls and alignment only.
