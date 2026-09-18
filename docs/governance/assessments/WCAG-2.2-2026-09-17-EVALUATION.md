# WCAG 2.2 Evaluation — 2026-09-17

**Reference:** WG-A11Y-001
**Date:** 2026-09-17
**Evaluator:** OpenAI ChatGPT (GPT-5.6 Sol), repository evaluation agent
**Type:** Bounded self-evaluation record; this report makes no WCAG Level A, AA, or AAA conformance claim and is not a certification.

## Scope

The evaluation scope is every canonical public HTML page plus every explicit state in `config/site-audit-states.json`, in English and Arabic, including the `/assurance` workbench. The route and state inventories are taken from repository declarations rather than a hand-maintained sample.

Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.

## Method

The evaluation follows the WCAG-EM sequence for defining scope, exploring the target, evaluating the defined scope, and recording results. Because this repository has a small finite public page/state inventory, the declared scope is evaluated directly rather than used to make a sampled whole-site conformance claim.

- **Automated:** `npm run test:site-accessibility` drives Chromium and the locked `axe-core` dependency over every canonical public route in English and Arabic and every configured state.
- **Scripted:** DEMO-289 adds a full-scope browser matrix for 320 CSS-pixel reflow, 200%/400% zoom-equivalent layout, WCAG text-spacing overrides, rendered target geometry, computed contrast, focus visibility/obscuring, forward/reverse keyboard traversal and trap detection, reduced motion, and forced colors.
- **Manual content review:** browser-derived heading/link/language/terminology inventories and repository content were reviewed for headings, link purpose, language of parts, unusual words, abbreviations, and reading-level concerns.
- **Assistive technology:** no real screen reader or other assistive technology was used. Criteria whose pass determination depends on that testing remain Partial.

## Result counts

| Level | Pass | Partial | Gap | N/A | Total |
|---|---:|---:|---:|---:|---:|
| A | 18 | 4 | 0 | 9 | 31 |
| AA | 16 | 4 | 1 | 3 | 24 |
| AAA | 13 | 12 | 0 | 6 | 31 |
| **All** | **47** | **20** | **1** | **18** | **86** |

N/A means the triggering content or behavior was absent from this evaluated scope. It is reported separately from Pass.

## Manual procedures actually executed

Manual content review was limited to the content-oriented procedures recorded for DEMO-289 in `docs/accessibility-manual-verification.json`. Human visual review of zoom, focus, forced colors, RTL, target exceptions, and real authentication remains pending there. No screen-reader result is recorded.

## Criterion results

### WCAG 1.1.1 Non-text Content

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 1.1.1 Non-text Content across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.2.1 Audio-only and Video-only (Prerecorded)

- **Level:** A
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.2.1 Audio-only and Video-only (Prerecorded) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.2.2 Captions (Prerecorded)

- **Level:** A
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.2.2 Captions (Prerecorded) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.2.3 Audio Description or Media Alternative (Prerecorded)

- **Level:** A
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.2.3 Audio Description or Media Alternative (Prerecorded) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.2.4 Captions (Live)

- **Level:** AA
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.2.4 Captions (Live) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.2.5 Audio Description (Prerecorded)

- **Level:** AA
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.2.5 Audio Description (Prerecorded) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.2.6 Sign Language (Prerecorded)

- **Level:** AAA
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.2.6 Sign Language (Prerecorded) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.2.7 Extended Audio Description (Prerecorded)

- **Level:** AAA
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.2.7 Extended Audio Description (Prerecorded) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.2.8 Media Alternative (Prerecorded)

- **Level:** AAA
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.2.8 Media Alternative (Prerecorded) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.2.9 Audio-only (Live)

- **Level:** AAA
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.2.9 Audio-only (Live) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.3.1 Info and Relationships

- **Level:** A
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted DOM/keyboard checks; manual source/content review; no real screen reader or other AT.
- **Rationale:** DEMO-289 found no automated or scripted failure for 1.3.1 Info and Relationships across all canonical public HTML pages and every configured audit state in English and Arabic, but real assistive-technology/screen-reader testing was not executed, so the criterion remains Partial.
- **Open limitation/gap:** Execute and record named real assistive-technology/screen-reader testing before considering a Pass.

### WCAG 1.3.2 Meaningful Sequence

- **Level:** A
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted DOM/keyboard checks; manual source/content review; no real screen reader or other AT.
- **Rationale:** DEMO-289 found no automated or scripted failure for 1.3.2 Meaningful Sequence across all canonical public HTML pages and every configured audit state in English and Arabic, but real assistive-technology/screen-reader testing was not executed, so the criterion remains Partial.
- **Open limitation/gap:** Execute and record named real assistive-technology/screen-reader testing before considering a Pass.

### WCAG 1.3.3 Sensory Characteristics

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 1.3.3 Sensory Characteristics across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.3.4 Orientation

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 1.3.4 Orientation across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.3.5 Identify Input Purpose

- **Level:** AA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted DOM/keyboard checks; manual source/content review; no real screen reader or other AT.
- **Rationale:** DEMO-289 found no automated or scripted failure for 1.3.5 Identify Input Purpose across all canonical public HTML pages and every configured audit state in English and Arabic, but real assistive-technology/screen-reader testing was not executed, so the criterion remains Partial.
- **Open limitation/gap:** Execute and record named real assistive-technology/screen-reader testing before considering a Pass.

### WCAG 1.3.6 Identify Purpose

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted DOM/keyboard checks; manual source/content review; no real screen reader or other AT.
- **Rationale:** DEMO-289 found no automated or scripted failure for 1.3.6 Identify Purpose across all canonical public HTML pages and every configured audit state in English and Arabic, but real assistive-technology/screen-reader testing was not executed, so the criterion remains Partial.
- **Open limitation/gap:** Execute and record named real assistive-technology/screen-reader testing before considering a Pass.

### WCAG 1.4.1 Use of Color

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 1.4.1 Use of Color across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.4.2 Audio Control

- **Level:** A
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.4.2 Audio Control across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.4.3 Contrast (Minimum)

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Rendered Chromium styles + axe computed contrast; both themes represented by the base harness; DEMO-289 full-scope scripted matrix.
- **Rationale:** DEMO-289 evaluated 1.4.3 Contrast (Minimum) across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.4.4 Resize Text

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted 200%/400% zoom-equivalent layout, 320 CSS-pixel reflow, and WCAG text-spacing overrides across every scoped page/state in en/ar.
- **Rationale:** DEMO-289 evaluated 1.4.4 Resize Text across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.4.5 Images of Text

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 1.4.5 Images of Text across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.4.6 Contrast (Enhanced)

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Rendered Chromium styles + axe computed contrast; both themes represented by the base harness; DEMO-289 full-scope scripted matrix.
- **Rationale:** Rendered browser checks and axe computed contrast found no AA contrast failure across the evaluated scope, but DEMO-289 did not establish the enhanced AAA contrast threshold for every rendered text/background combination, so 1.4.6 remains Partial.
- **Open limitation/gap:** Complete an exhaustive enhanced-contrast (AAA threshold) review for rendered text/background combinations in both themes.

### WCAG 1.4.7 Low or No Background Audio

- **Level:** AAA
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 1.4.7 Low or No Background Audio across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 1.4.8 Visual Presentation

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 reviewed the current implementation and public content for 1.4.8 Visual Presentation; meaningful support is present, but the full AAA condition was not established for every page/state and localized workflow, so the result is Partial.
- **Open limitation/gap:** Complete the remaining criterion-specific AAA/manual coverage identified in the DEMO-289 evaluation report.

### WCAG 1.4.9 Images of Text (No Exception)

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 1.4.9 Images of Text (No Exception) across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.4.10 Reflow

- **Level:** AA
- **Result:** Gap
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted 200%/400% zoom-equivalent layout, 320 CSS-pixel reflow, and WCAG text-spacing overrides across every scoped page/state in en/ar.
- **Rationale:** DEMO-289 observed a real WCAG 1.4.10 reflow failure on /demos in the D1 presentation/workbench at 320 CSS px / 400%-equivalent layout: the root document measured approximately 334px scroll width against a 320px viewport. The two D1 table-tab controls with 145px minimum widths were isolated as the cause. No site-wide reflow failure is asserted, and remediation is outside DEMO-289 evaluation scope.
- **Open limitation/gap:** /demos D1 presentation/workbench produces root-document horizontal overflow at the 320 CSS px / 400%-equivalent viewport: approximately 334px scroll width against a 320px viewport because the two D1 table-tab controls retain 145px minimum widths. Remediation is outside DEMO-289 evaluation scope.

### WCAG 1.4.11 Non-text Contrast

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Rendered Chromium styles + axe computed contrast; both themes represented by the base harness; DEMO-289 full-scope scripted matrix.
- **Rationale:** DEMO-289 evaluated 1.4.11 Non-text Contrast across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.4.12 Text Spacing

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted 200%/400% zoom-equivalent layout, 320 CSS-pixel reflow, and WCAG text-spacing overrides across every scoped page/state in en/ar.
- **Rationale:** DEMO-289 evaluated 1.4.12 Text Spacing across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 1.4.13 Content on Hover or Focus

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 1.4.13 Content on Hover or Focus across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.1.1 Keyboard

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted keyboard traversal including forward/reverse Tab and trap detection, plus existing widget keyboard interaction audit.
- **Rationale:** DEMO-289 evaluated 2.1.1 Keyboard across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.1.2 No Keyboard Trap

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted keyboard traversal including forward/reverse Tab and trap detection, plus existing widget keyboard interaction audit.
- **Rationale:** DEMO-289 evaluated 2.1.2 No Keyboard Trap across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.1.3 Keyboard (No Exception)

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted keyboard traversal including forward/reverse Tab and trap detection, plus existing widget keyboard interaction audit.
- **Rationale:** DEMO-289 evaluated 2.1.3 Keyboard (No Exception) across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.1.4 Character Key Shortcuts

- **Level:** A
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 2.1.4 Character Key Shortcuts across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 2.2.1 Timing Adjustable

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.2.1 Timing Adjustable across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.2.2 Pause, Stop, Hide

- **Level:** A
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 2.2.2 Pause, Stop, Hide across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 2.2.3 No Timing

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.2.3 No Timing across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.2.4 Interruptions

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.2.4 Interruptions across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.2.5 Re-authenticating

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.2.5 Re-authenticating across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.2.6 Timeouts

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.2.6 Timeouts across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.3.1 Three Flashes or Below Threshold

- **Level:** A
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 2.3.1 Three Flashes or Below Threshold across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 2.3.2 Three Flashes

- **Level:** AAA
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 2.3.2 Three Flashes across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 2.3.3 Animation from Interactions

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.3.3 Animation from Interactions across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.1 Bypass Blocks

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.4.1 Bypass Blocks across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.2 Page Titled

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.4.2 Page Titled across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.3 Focus Order

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.4.3 Focus Order across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.4 Link Purpose (In Context)

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.4.4 Link Purpose (In Context) across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.5 Multiple Ways

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.4.5 Multiple Ways across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.6 Headings and Labels

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.4.6 Headings and Labels across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.7 Focus Visible

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted keyboard focus traversal with rendered focus-indicator and center-point obscuring checks across every scoped page/state in en/ar.
- **Rationale:** DEMO-289 evaluated 2.4.7 Focus Visible across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.8 Location

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.4.8 Location across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.9 Link Purpose (Link Only)

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 reviewed the current implementation and public content for 2.4.9 Link Purpose (Link Only); meaningful support is present, but the full AAA condition was not established for every page/state and localized workflow, so the result is Partial.
- **Open limitation/gap:** Complete the remaining criterion-specific AAA/manual coverage identified in the DEMO-289 evaluation report.

### WCAG 2.4.10 Section Headings

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.4.10 Section Headings across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.11 Focus Not Obscured (Minimum)

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted keyboard focus traversal with rendered focus-indicator and center-point obscuring checks across every scoped page/state in en/ar.
- **Rationale:** DEMO-289 evaluated 2.4.11 Focus Not Obscured (Minimum) across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.12 Focus Not Obscured (Enhanced)

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted keyboard focus traversal with rendered focus-indicator and center-point obscuring checks across every scoped page/state in en/ar.
- **Rationale:** DEMO-289 evaluated 2.4.12 Focus Not Obscured (Enhanced) across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.4.13 Focus Appearance

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted keyboard focus traversal with rendered focus-indicator and center-point obscuring checks across every scoped page/state in en/ar.
- **Rationale:** DEMO-289 evaluated 2.4.13 Focus Appearance across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.5.1 Pointer Gestures

- **Level:** A
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 2.5.1 Pointer Gestures across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 2.5.2 Pointer Cancellation

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.5.2 Pointer Cancellation across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.5.3 Label in Name

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.5.3 Label in Name across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.5.4 Motion Actuation

- **Level:** A
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 2.5.4 Motion Actuation across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 2.5.5 Target Size (Enhanced)

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted rendered target-geometry measurement: 24px minimum gate plus 44px enhanced-target inventory across every scoped page/state in en/ar.
- **Rationale:** DEMO-289 measured rendered actionable targets across the evaluated scope. The 24 CSS-pixel minimum gate passed, while 44 CSS-pixel enhanced-target coverage still contains controls requiring criterion-exception review, so 2.5.5 remains Partial.
- **Open limitation/gap:** Review each sub-44 CSS-pixel target against the enhanced target-size criterion exceptions and remediate any non-exempt target.

### WCAG 2.5.6 Concurrent Input Mechanisms

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.5.6 Concurrent Input Mechanisms across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.5.7 Dragging Movements

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 2.5.7 Dragging Movements across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 2.5.8 Target Size (Minimum)

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Scripted rendered target-geometry measurement: 24px minimum gate plus 44px enhanced-target inventory across every scoped page/state in en/ar.
- **Rationale:** DEMO-289 evaluated 2.5.8 Target Size (Minimum) across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.1.1 Language of Page

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual browser-derived content inventory review of headings, language parts, terminology, abbreviations, and reading complexity, supported by deterministic lang/dir checks.
- **Rationale:** DEMO-289 evaluated 3.1.1 Language of Page across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.1.2 Language of Parts

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual browser-derived content inventory review of headings, language parts, terminology, abbreviations, and reading complexity, supported by deterministic lang/dir checks.
- **Rationale:** DEMO-289 evaluated 3.1.2 Language of Parts across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.1.3 Unusual Words

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual browser-derived content inventory review of headings, language parts, terminology, abbreviations, and reading complexity, supported by deterministic lang/dir checks.
- **Rationale:** DEMO-289 manually reviewed headings and public text inventories for 3.1.3 Unusual Words. Technical terminology, abbreviations, pronunciation/readability support, and translated explanatory coverage are not complete enough to record an AAA pass, so the result is Partial.
- **Open limitation/gap:** Complete criterion-specific terminology, abbreviation, pronunciation, and reading-level support across the full localized content scope.

### WCAG 3.1.4 Abbreviations

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual browser-derived content inventory review of headings, language parts, terminology, abbreviations, and reading complexity, supported by deterministic lang/dir checks.
- **Rationale:** DEMO-289 manually reviewed headings and public text inventories for 3.1.4 Abbreviations. Technical terminology, abbreviations, pronunciation/readability support, and translated explanatory coverage are not complete enough to record an AAA pass, so the result is Partial.
- **Open limitation/gap:** Complete criterion-specific terminology, abbreviation, pronunciation, and reading-level support across the full localized content scope.

### WCAG 3.1.5 Reading Level

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual browser-derived content inventory review of headings, language parts, terminology, abbreviations, and reading complexity, supported by deterministic lang/dir checks.
- **Rationale:** DEMO-289 manually reviewed headings and public text inventories for 3.1.5 Reading Level. Technical terminology, abbreviations, pronunciation/readability support, and translated explanatory coverage are not complete enough to record an AAA pass, so the result is Partial.
- **Open limitation/gap:** Complete criterion-specific terminology, abbreviation, pronunciation, and reading-level support across the full localized content scope.

### WCAG 3.1.6 Pronunciation

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual browser-derived content inventory review of headings, language parts, terminology, abbreviations, and reading complexity, supported by deterministic lang/dir checks.
- **Rationale:** DEMO-289 manually reviewed headings and public text inventories for 3.1.6 Pronunciation. Technical terminology, abbreviations, pronunciation/readability support, and translated explanatory coverage are not complete enough to record an AAA pass, so the result is Partial.
- **Open limitation/gap:** Complete criterion-specific terminology, abbreviation, pronunciation, and reading-level support across the full localized content scope.

### WCAG 3.2.1 On Focus

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 3.2.1 On Focus across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.2.2 On Input

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 3.2.2 On Input across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.2.3 Consistent Navigation

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 3.2.3 Consistent Navigation across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.2.4 Consistent Identification

- **Level:** AA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 3.2.4 Consistent Identification across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.2.5 Change on Request

- **Level:** AAA
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 3.2.5 Change on Request across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.2.6 Consistent Help

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 3.2.6 Consistent Help across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.3.1 Error Identification

- **Level:** A
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted DOM/keyboard checks; manual source/content review; no real screen reader or other AT.
- **Rationale:** DEMO-289 found no automated or scripted failure for 3.3.1 Error Identification across all canonical public HTML pages and every configured audit state in English and Arabic, but real assistive-technology/screen-reader testing was not executed, so the criterion remains Partial.
- **Open limitation/gap:** Execute and record named real assistive-technology/screen-reader testing before considering a Pass.

### WCAG 3.3.2 Labels or Instructions

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 3.3.2 Labels or Instructions across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.3.3 Error Suggestion

- **Level:** AA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted DOM/keyboard checks; manual source/content review; no real screen reader or other AT.
- **Rationale:** DEMO-289 found no automated or scripted failure for 3.3.3 Error Suggestion across all canonical public HTML pages and every configured audit state in English and Arabic, but real assistive-technology/screen-reader testing was not executed, so the criterion remains Partial.
- **Open limitation/gap:** Execute and record named real assistive-technology/screen-reader testing before considering a Pass.

### WCAG 3.3.4 Error Prevention (Legal, Financial, Data)

- **Level:** AA
- **Result:** N/A
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Manual content/behavior inventory supported by Chromium DOM snapshots for every scoped page/state in en/ar.
- **Rationale:** The DEMO-289 content and behavior inventory found no triggering content for 3.3.4 Error Prevention (Legal, Financial, Data) across all canonical public HTML pages and every configured audit state in English and Arabic; applicability must be reassessed if that content or behavior is introduced.
- **Open limitation/gap:** Reassess applicability when the triggering content or behavior enters the public scope.

### WCAG 3.3.5 Help

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 reviewed the current implementation and public content for 3.3.5 Help; meaningful support is present, but the full AAA condition was not established for every page/state and localized workflow, so the result is Partial.
- **Open limitation/gap:** Complete the remaining criterion-specific AAA/manual coverage identified in the DEMO-289 evaluation report.

### WCAG 3.3.6 Error Prevention (All)

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 reviewed the current implementation and public content for 3.3.6 Error Prevention (All); meaningful support is present, but the full AAA condition was not established for every page/state and localized workflow, so the result is Partial.
- **Open limitation/gap:** Complete the remaining criterion-specific AAA/manual coverage identified in the DEMO-289 evaluation report.

### WCAG 3.3.7 Redundant Entry

- **Level:** A
- **Result:** Pass
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe full-scope sweep plus DEMO-289 scripted browser matrix; manual content review where the criterion is content-dependent.
- **Rationale:** DEMO-289 evaluated 3.3.7 Redundant Entry across all canonical public HTML pages and every configured audit state in English and Arabic; the Chromium/axe gate, criterion-relevant scripted checks, and applicable manual content review found no observed failure for the criterion in that bounded scope.

### WCAG 3.3.8 Accessible Authentication (Minimum)

- **Level:** AA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted browser review of public authentication UI; real password-manager/credential workflow not executed.
- **Rationale:** The public implementation for 3.3.8 Accessible Authentication (Minimum) was inspected and exercised in the browser matrix, but the credential/password-manager and real authentication environment procedure was not executed; the criterion therefore remains Partial.
- **Open limitation/gap:** Execute the documented accessible-authentication procedure with paste and a real password-manager/credential environment.

### WCAG 3.3.9 Accessible Authentication (Enhanced)

- **Level:** AAA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted browser review of public authentication UI; real password-manager/credential workflow not executed.
- **Rationale:** The public implementation for 3.3.9 Accessible Authentication (Enhanced) was inspected and exercised in the browser matrix, but the credential/password-manager and real authentication environment procedure was not executed; the criterion therefore remains Partial.
- **Open limitation/gap:** Execute the documented accessible-authentication procedure with paste and a real password-manager/credential environment.

### WCAG 4.1.2 Name, Role, Value

- **Level:** A
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted DOM/keyboard checks; manual source/content review; no real screen reader or other AT.
- **Rationale:** DEMO-289 found no automated or scripted failure for 4.1.2 Name, Role, Value across all canonical public HTML pages and every configured audit state in English and Arabic, but real assistive-technology/screen-reader testing was not executed, so the criterion remains Partial.
- **Open limitation/gap:** Execute and record named real assistive-technology/screen-reader testing before considering a Pass.

### WCAG 4.1.3 Status Messages

- **Level:** AA
- **Result:** Partial
- **Pages and states checked:** Public pages: /assurance, /demos, /, /offline, /security. Configured states: assurance-security-record (/assurance#ISO27001-A.5.1), assurance-evidence-record (/assurance#ISO27001-A.5.19), assurance-accessibility-record (/assurance#WCAG-1.1.1), assurance-rtl-record (/assurance?lang=ar#ISO27001-A.5.1), accessibility-lab (/demos#accessibility), openapi-console (/demos#rest), homepage-availability-proof (/). Locales: en, ar.
- **Method:** Chromium/axe + scripted DOM/keyboard checks; manual source/content review; no real screen reader or other AT.
- **Rationale:** DEMO-289 found no automated or scripted failure for 4.1.3 Status Messages across all canonical public HTML pages and every configured audit state in English and Arabic, but real assistive-technology/screen-reader testing was not executed, so the criterion remains Partial.
- **Open limitation/gap:** Execute and record named real assistive-technology/screen-reader testing before considering a Pass.

## Boundary

This evaluation records criterion-level engineering results for the dated repository scope. It does not claim a WCAG conformance level, does not certify the site, and does not infer unperformed manual or assistive-technology testing from automation.
