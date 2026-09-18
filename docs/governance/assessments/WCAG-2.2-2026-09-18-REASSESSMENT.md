# WCAG 2.2 Focused Reassessment — 2026-09-18

**Reference:** WG-A11Y-002
**Date:** 2026-09-18
**Evaluator:** OpenAI ChatGPT (GPT-5.6 Sol), repository evaluation agent
**Type:** Bounded self-evaluation addendum; this record makes no WCAG Level A, AA, or AAA conformance claim and is not a certification.

## Scope

This record is a focused reassessment of the accessibility defects remediated by DEMO-304. It does not replace or rewrite WG-A11Y-001, the 2026-09-17 full-scope evaluation. The historical findings in that record remain unchanged.

The changed behavior is limited to:

- the D1 table-tab layout in `/demos#d1` at the 320 CSS-pixel / 400%-equivalent reflow boundary;
- repeated `Open location`, `Open evidence record`, and `Open documentation` links in `/assurance`;
- repeated `Route source` links in the Accessibility, Durable Objects, Edge, and Workers demo presentations and the shared shell.

The criteria reassessed are WCAG 2.2 1.4.10 Reflow, 2.4.4 Link Purpose (In Context), and 2.4.9 Link Purpose (Link Only). No other criterion status is changed by this record.

## Method

The reassessment combines source review with the repository's existing accessibility and localization gates:

- the D1 table-tab rules are inspected to confirm the fixed 145 CSS-pixel minimum width is removed without hiding either tab or its panel;
- `npm run test:site-accessibility` and `npm run validate:site-accessibility` exercise the declared browser matrix, including the 320 CSS-pixel reflow boundary used by WG-A11Y-001;
- the repeated-link markup is reviewed to confirm every destination-specific accessible name contains the evidence title, documentation reference, or route-source module;
- `npm run validate:site-i18n`, `npm run validate:locales`, and the six-locale presentation catalog verify that the repeated action phrases are available in English, Spanish, French, German, Japanese, and Arabic;
- `npm run validate:wcag`, `npm run validate:assurance`, `npm run validate:assurance-summaries`, and `npm run validate:governance` verify the reassessed records, references, and lifecycle approval.

These checks are bounded engineering evidence. They do not substitute for human browser, environmental, or assistive-technology procedures that remain pending in `docs/accessibility-manual-verification.json`.

## Criterion results

### WCAG 1.4.10 Reflow

- **Level:** AA
- **Result:** Pass
- **Changed scope:** `/demos#d1` at the 320 CSS-pixel / 400%-equivalent layout boundary identified in WG-A11Y-001.
- **Rationale:** DEMO-304 removes the fixed 145 CSS-pixel minimum width from both D1 table-tab controls. The controls remain present and operable, their content is not clipped or hidden, and the existing narrow-layout accessibility matrix is the regression boundary for the root-document overflow recorded on 2026-09-17.
- **Remaining limitation:** This is a bounded criterion result for the documented repository scope, not a WCAG conformance claim. Human browser/environment verification remains separate where the manual matrix marks it pending.

### WCAG 2.4.4 Link Purpose (In Context)

- **Level:** A
- **Result:** Pass
- **Changed scope:** repeated assurance evidence/documentation actions and repeated demo/shell `Route source` links.
- **Rationale:** Visible link text and its surrounding context remain available. DEMO-304 additionally gives each repeated link a destination-specific accessible name, so the remediation does not reduce the contextual purpose that WG-A11Y-001 previously evaluated.
- **Remaining limitation:** This focused reassessment does not change the separate pending human and assistive-technology procedures in the manual verification matrix.

### WCAG 2.4.9 Link Purpose (Link Only)

- **Level:** AAA
- **Result:** Pass
- **Changed scope:** repeated assurance evidence/documentation actions and repeated demo/shell `Route source` links.
- **Rationale:** Each `Open location` and `Open evidence record` link now names its evidence title; each `Open documentation` link names its documentation reference; and each repeated `Route source` link names its source module. The action phrase is localized through the existing presentation catalog in all six supported locales, while the destination identifier remains the public evidence title, documentation reference, or module path.
- **Remaining limitation:** Pass is a bounded engineering assessment of this criterion in the documented current scope. It does not establish Level AAA or any other WCAG conformance level for a page or the product.

## Result change

| Criterion | WG-A11Y-001 | WG-A11Y-002 |
|---|---|---|
| 1.4.10 Reflow | Gap | Pass |
| 2.4.4 Link Purpose (In Context) | Pass | Pass |
| 2.4.9 Link Purpose (Link Only) | Partial | Pass |

The canonical WCAG records retain their existing evidence relationships and add this reassessment as documentation for the three affected criteria. WG-A11Y-001 remains unchanged as the historical 2026-09-17 evaluation.
