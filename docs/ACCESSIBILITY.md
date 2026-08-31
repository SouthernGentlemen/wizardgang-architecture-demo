# Accessibility demonstration plan

The whole site is expected to follow WCAG 2.2-oriented engineering practices; `/accessibility` makes those behaviors explicit and inspectable.

Baseline checklist:

- semantic HTML and landmarks;
- logical headings;
- keyboard-only operation;
- visible focus;
- accessible names/labels;
- error/status messaging that does not rely on color alone;
- sufficient contrast;
- responsive layout and text reflow;
- predictable navigation;
- restrained ARIA used only when native semantics are insufficient;
- correct `lang` and locale direction;
- accessible dynamic demo output using live regions where appropriate.

Status language remains **WCAG 2.2 aligned — uncertified** until independent certification exists.

The live `/accessibility` interaction and shared page shell implement this baseline. `tests/interface.test.ts` verifies language/direction output, label/error relationships, skip navigation, invalid-state semantics, and status output. CI evidence supports the implementation but does not replace manual keyboard, zoom/reflow, contrast, screen-reader, browser, and assistive-technology testing.
