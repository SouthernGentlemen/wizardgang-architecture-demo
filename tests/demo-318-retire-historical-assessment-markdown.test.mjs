import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const currentAssessment = 'docs/governance/AI-IMPACT-ASSESSMENT.md';
const historical = [
  'docs/governance/assessments/ISO-27001-2026-09-17-SELF-ASSESSMENT.md',
  'docs/governance/assessments/ISO-27001-2026-09-18-REPOSITORY-PROTECTION-ADDENDUM.md',
  'docs/governance/assessments/ISO-42001-2026-09-17-SELF-ASSESSMENT.md',
  'docs/governance/assessments/MCP-AI-IMPACT-ASSESSMENT.md',
  'docs/governance/assessments/WCAG-2.2-2026-09-17-EVALUATION.md',
  'docs/governance/assessments/WCAG-2.2-2026-09-18-REASSESSMENT.md',
];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function documentationTargets(record) {
  return (record.relationships ?? [])
    .filter((relationship) => relationship.relation === 'documentation')
    .map((relationship) => relationship.to?.native ?? '');
}

describe('DEMO-318 historical assessment Markdown retirement', () => {
  it('removes the historical assessment corpus and keeps one current AI impact assessment identity', () => {
    for (const path of historical) expect(existsSync(join(root, path)), path).toBe(false);
    expect(existsSync(join(root, 'docs/governance/assessments'))).toBe(false);
    expect(existsSync(join(root, currentAssessment))).toBe(true);

    const registry = JSON.parse(read('docs/governance/REFERENCE-REGISTRY.json'));
    const byReference = new Map(registry.records.map((record) => [record.reference, record.path]));
    expect(byReference.get('WG-AIA-001')).toBe(currentAssessment);
    expect(byReference.has('WG-A11Y-001')).toBe(false);
    expect(byReference.has('WG-A11Y-002')).toBe(false);
  });

  it('keeps the active AI assessment current-state, method-focused, and free of delivery-history framing', () => {
    const assessment = read(currentAssessment);
    for (const heading of [
      '## 1. Purpose',
      '## 3. What WizardGang Controls',
      '## 4. Intended Use',
      '## 5. Intended Users and Affected Parties',
      '## 8. Human Oversight',
      '## 10. Treatment State',
      '## 11. Negative and Adverse Impact Assessment',
      '## 13. Mandatory Reassessment Triggers',
    ]) expect(assessment).toContain(heading);

    expect(assessment).toContain('ISO/IEC 42001:2023');
    expect(assessment).toContain('ISO/IEC 42005:2025');
    expect(assessment).toContain('ISO/IEC 27001:2022 with Amendment 1:2024');
    expect(assessment).toContain('Model Context Protocol specification 2026-07-28');
    expect(assessment).toContain('Review due:** 2026-12-02');
    expect(assessment).not.toContain('Approval record');
    expect(assessment).not.toContain('Subject to approval');
    expect(assessment).not.toMatch(/\bPR\s*#\d+\b/);
    expect(assessment).not.toMatch(/\b[0-9a-f]{40}\b/);
    expect(assessment).not.toContain('docs/governance/assessments/');
  });

  it('moves compliance documentation relationships to current governing Markdown without changing evidence authority', () => {
    const compliancePaths = [
      'assurance/compliance/iso-27001-2022.json',
      'assurance/compliance/iso-42001-2023.json',
      'assurance/compliance/wcag-2.2/perceivable.json',
      'assurance/compliance/wcag-2.2/operable.json',
      'assurance/compliance/wcag-2.2/understandable.json',
      'assurance/compliance/wcag-2.2/robust.json',
    ];

    for (const path of compliancePaths) {
      const document = JSON.parse(read(path));
      const records = document.records ?? document.criteria ?? [];
      for (const record of records) {
        for (const target of documentationTargets(record)) {
          expect(target, record.id).not.toContain('docs/governance/assessments/');
        }
      }
    }

    const iso42001 = JSON.parse(read('assurance/compliance/iso-42001-2023.json'));
    expect(iso42001.records.some((record) => documentationTargets(record).some((target) => target.startsWith(currentAssessment + '#')))).toBe(true);

    const wcagPaths = [
      'assurance/compliance/wcag-2.2/perceivable.json',
      'assurance/compliance/wcag-2.2/operable.json',
      'assurance/compliance/wcag-2.2/understandable.json',
      'assurance/compliance/wcag-2.2/robust.json',
    ];
    const wcagRecords = wcagPaths.flatMap((path) => JSON.parse(read(path)).criteria);
    expect(wcagRecords).toHaveLength(86);
    for (const record of wcagRecords) {
      expect(documentationTargets(record)).toContain('docs/ACCESSIBILITY.md#current-wcag-22-assurance-boundary');
    }
  });

  it('uses the current WCAG Recommendation and errata as the accessibility documentation baseline', () => {
    const accessibility = read('docs/ACCESSIBILITY.md');
    expect(accessibility).toContain('## Current WCAG 2.2 assurance boundary');
    expect(accessibility).toContain('12 December 2024');
    expect(accessibility).toContain('https://www.w3.org/WAI/WCAG22/errata/');
    expect(accessibility).toContain('assurance/compliance/wcag-2.2/**');
    expect(accessibility).not.toContain('Dated accessibility assessments');
  });

  it('prevents historical assessment Markdown from becoming a compliance documentation authority again', () => {
    const validator = read('scripts/validate-assurance-documentation.mjs');
    expect(validator).toContain("parsed.repositoryPath.startsWith('docs/governance/assessments/')");
    expect(validator).toContain('retired historical assessment Markdown');
  });
});
