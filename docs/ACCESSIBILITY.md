# Accessibility demonstration and manual matrix

The whole site follows WCAG 2.2-oriented engineering practices. `/accessibility` makes twelve behaviors explicit through an accessible default and an opt-in broken teaching preset. Broken content runs in a titled `srcdoc` frame with `sandbox="allow-scripts allow-forms"`; it is not evidence about the surrounding site.

Status language remains **WCAG 2.2 AA demonstration — uncertified** until independent certification exists. AAA behavior is labeled enhanced guidance and is not counted toward the AA statement.

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

`tests/interface.test.ts` verifies the sandbox boundary, accessible and broken fixtures, locally executed axe protocol, default mode, and all twelve criterion cards. CI also validates types, localization, contracts, security, dependencies, migrations, and the Worker build. Browser and assistive-technology results must be recorded separately for a release; CI evidence does not replace those tests.
