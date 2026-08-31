# Changelog

## 0.1.0 - Complete scaffold refresh

- Added stable public route registry for the full WizardGang architecture surface.
- Added direct route-to-source links and machine-readable route manifest.
- Added repository-native `docs/ARCHITECTURE-STANDARD.md`; removed PDF dependency from the package.
- Added shared D1 `demo-blob` records and audit baseline.
- Added operations schemas for health history and synthetic usage/cost snapshots.
- Added public operations route family: dashboard, uptime, health, docs, and billing.
- Added `/dashboard/logs` and `/__api/operations/logs` with D1-backed public-safe operational logging, bounded filters, and defensive structured-detail redaction.
- Added machine-readable `/health` and `/version` endpoints.
- Added protected `/admin` online/offline controls with D1-persisted state.
- Added safe audit events for demo state transitions.
- Added `/offline` maintenance page with **“Oops! demo is down.”** messaging.
- Hardened offline routing so browser HTML requests redirect while API/non-HTML/write requests return JSON `503`.
- Kept dashboard/status/admin routes reachable during intentional offline state.
- Added `docs/OPERATIONS.md` with dashboard, billing, health, uptime, admin, and offline behavior requirements.
- Refreshed Sol Very High kickoff prompt to cover runtime, APIs, identity, MCP, WCAG/i18n, dashboard/admin operations, Git/release evidence, and governance.
- Added CI/deploy workflow scaffolding.
