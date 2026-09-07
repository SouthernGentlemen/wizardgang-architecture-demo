# Accessibility demonstration, criterion registry, and manual matrix

The whole site follows WCAG 2.2-oriented engineering practices. `/interfaces?view=accessibility` makes twelve behaviors explicit through an accessible default and an opt-in broken teaching preset. Broken content runs in a titled `srcdoc` frame with `sandbox="allow-scripts allow-forms"`; it is not evidence about the surrounding site.

Status language is **WCAG 2.2 engineering evidence — no conformance claim**. The repository does not claim Level A, AA, or AAA conformance or certification. Criterion-level status describes implementation and evidence only; a demonstrated or partial record is not a success-criterion result.

## Public WCAG 2.2 criterion registry

`assurance/compliance/wcag-2.2.json` is the canonical public registry manifest. It points to four principle partitions under `assurance/compliance/wcag-2.2/` containing all current WCAG 2.2 Level A, AA, and AAA success criteria from W3C, excluding obsolete and removed 4.1.1 Parsing. Each criterion record carries the W3C criterion ID, name, level, implementation/evidence status, implementation note, automated/manual validation split, evidence IDs, known gaps, owner, and freshness rules.

`/compliance?framework=wcag-2.2` is the human-readable projection of those criterion records. Its framework, status, and level filters use native labeled controls; each criterion row has a stable `WCAG-<criterionId>` anchor, links back to its canonical partition, and links each evidence ID to `/evidence`. The same normalized records are available from `GET /v1/assurance/compliance?framework=wcag-2.2`, with exact lookup at `GET /v1/assurance/compliance/WCAG-<criterionId>`. The projection derives counts at request time and does not add conformance meaning to the source status.

W3C remains the primary source for criterion identity and meaning:

- WCAG 2.2 Recommendation: `https://www.w3.org/TR/WCAG22/`
- W3C machine-readable WCAG 2.2 data: `https://www.w3.org/WAI/WCAG22/wcag.json`
- Understanding Conformance: `https://www.w3.org/WAI/WCAG22/Understanding/conformance.html`
- Understanding Techniques: `https://www.w3.org/WAI/WCAG22/Understanding/understanding-techniques.html`

The W3C criterion IDs, names, and levels are kept distinct from WizardGang-added implementation/evidence annotations. Techniques are informative; they are not substituted for the success criteria. Automated evidence is always marked partial or absent, and manual evaluation remains explicitly required.

### Registry status vocabulary

- `demonstrated` — a deliberate implementation or teaching comparison exists with repository evidence; no criterion pass is asserted.
- `partial` — related implementation exists, but criterion-specific scope or manual evidence is incomplete.
- `gap` — criterion-specific implementation or evaluation evidence is known to be incomplete.
- `not-observed` — triggering content or behavior was not observed in the documented current scope; applicability must be reassessed when that scope changes.

The registry is reassessed before releases that change public accessibility behavior, on relevant content or interaction changes, and at least every 90 days for the documented manual review. These freshness rules describe when evidence must be revisited; they do not create a conformance claim.

## Automated evidence

The isolated frame bundles `axe-core` from the locked application dependency and returns sanitized rule identifiers, impact levels, and duration through a validated `postMessage` envelope. Automated checking is partial coverage: a zero-violation result never establishes conformance. Broken-mode findings are deterministic teaching evidence, not a conformance result.

## Manual verification matrix

| Area | Procedure | Expected accessible behavior | Release evidence |
|---|---|---|---|
| Keyboard sequence | Traverse the page and frame with Tab and Shift+Tab | Logical order; every action operates without a pointer | Required |
| Visible focus | Traverse all interactive elements in both themes | A three CSS-pixel focus token remains visible | Required |
| Focus not obscured | Focus the last task control at 200% zoom | Persistent content does not fully hide the control | Required |
| Dialog | Open options, traverse, press Escape, reopen and close | Initial focus, trapped Tab, Escape close, and trigger focus return | Required |
| Screen-reader semantics | Inspect landmarks, headings, form names, image text, dialog, and status | Roles, names, descriptions, and hierarchy are meaningful | Required |
| Target sizing | Inspect compact actions at 100% zoom | Targets meet 24×24 CSS pixels or the spacing exception | Required |
| Accessible authentication | Paste into the password field and use saved credentials or passkey | Paste and password-manager support are not blocked; a non-cognitive path exists | Required |
| Drag alternative | Reorder the task without dragging | Move buttons provide the same outcome | Required |
| Zoom and reflow | Test at 320 CSS pixels and 400% zoom | No two-dimensional scrolling for ordinary content; controls remain usable | Required |
| Forced colors | Enable a forced-colors/high-contrast mode | Focus, controls, boundaries, and state remain perceivable | Required |
| Reduced motion | Enable reduced motion | Nonessential animation and smooth movement are removed | Required |
| Consistent help | Compare repeated view states | Help remains in a predictable relative location | Required |

## Repository checks

`tests/interface.test.ts` verifies the sandbox boundary, accessible and broken fixtures, locally executed axe protocol, default mode, and all twelve criterion cards. `tests/assurance-wcag.test.ts` verifies registry exhaustiveness, A/AA/AAA level counts, removal of obsolete 4.1.1, evidence resolution, W3C source identity, non-conformance wording, validation distinction, and freshness metadata. `tests/assurance-compliance-api.test.ts` verifies the accessible compliance projection, stable WCAG anchors, shared filters, derived counts, and exact-record API lookup. `npm run validate:wcag` repeats the canonical ID/name/level validation and evidence checks from a standalone repository validator.

CI also validates types, localization, contracts, security, dependencies, migrations, and the Worker build. Browser and assistive-technology results must be recorded separately for a release; CI evidence does not replace those tests.
