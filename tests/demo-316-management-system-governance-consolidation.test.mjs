import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const governanceRoot = join(root, 'docs/governance');

const canonical = [
  'docs/governance/GOVERNANCE.md',
  'docs/governance/RISK-MANAGEMENT.md',
  'docs/governance/ASSURANCE-AND-AUDIT.md',
];

const retired = [
  'docs/governance/CONTEXT.md',
  'docs/governance/INTERESTED-PARTIES.md',
  'docs/governance/SCOPE.md',
  'docs/governance/MANAGEMENT-SYSTEM.md',
  'docs/governance/LEADERSHIP.md',
  'docs/governance/ROLES-RESPONSIBILITIES.md',
  'docs/governance/MANAGEMENT-SYSTEM-CHANGE-PLANNING.md',
  'docs/governance/MANAGEMENT-SYSTEM-SUPPORT.md',
  'docs/governance/COMPETENCE-AWARENESS-COMMUNICATION.md',
  'docs/governance/OPERATIONAL-PLANNING-CONTROL.md',
  'docs/governance/OPERATIONAL-RISK-AND-AI-REASSESSMENT.md',
  'docs/governance/MONITORING-MEASUREMENT-EVALUATION.md',
  'docs/governance/INTERNAL-AUDIT-AND-SELF-ASSESSMENT.md',
  'docs/governance/MANAGEMENT-REVIEW.md',
  'docs/governance/NONCONFORMITY-CORRECTIVE-ACTION-CONTINUAL-IMPROVEMENT.md',
  'docs/governance/CONTROL-AND-DOCUMENT-INDEX.md',
];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}


function plainHeadingText(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[`*_~]/g, '')
    .trim();
}

function githubSlug(value) {
  return plainHeadingText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function headingAnchors(markdown) {
  const anchors = new Set();
  const counts = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const base = githubSlug(match[2]);
    if (!base) continue;
    const duplicate = counts.get(base) ?? 0;
    counts.set(base, duplicate + 1);
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`);
  }
  return anchors;
}

const headingCache = new Map();

function anchors(path) {
  if (!headingCache.has(path)) headingCache.set(path, headingAnchors(read(path)));
  return headingCache.get(path);
}

describe('DEMO-316 management-system governance consolidation', () => {
  it('collapses fragmented clause documents to a much smaller current-state governance set', () => {
    for (const path of canonical) expect(existsSync(join(root, path)), path).toBe(true);
    for (const path of retired) expect(existsSync(join(root, path)), path).toBe(false);

    const topLevelMarkdown = readdirSync(governanceRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort();

    expect(topLevelMarkdown.length).toBeLessThanOrEqual(16);
    expect(topLevelMarkdown).not.toContain('CONTROL-AND-DOCUMENT-INDEX.md');
  });

  it('keeps the reference registry identity-only and pointed at consolidated authorities', () => {
    const registry = JSON.parse(read('docs/governance/REFERENCE-REGISTRY.json'));
    const byReference = new Map(registry.records.map((record) => [record.reference, record.path]));

    expect(registry.authority).toBe('reference-identity-only');
    expect(byReference.get('WG-GOV-001')).toBe('docs/governance/GOVERNANCE.md');
    expect(byReference.get('WG-GOV-007')).toBe('docs/governance/RISK-MANAGEMENT.md');
    expect(byReference.get('WG-GOV-012')).toBe('docs/governance/ASSURANCE-AND-AUDIT.md');
    for (const path of retired) expect(registry.records.some((record) => record.path === path), path).toBe(false);
  });

  it('keeps structured compliance documentation relationships on current headings without changing their state authority', () => {
    let documentationRelationships = 0;

    for (const path of ['assurance/compliance/iso-27001-2022.json', 'assurance/compliance/iso-42001-2023.json']) {
      const framework = JSON.parse(read(path));
      for (const record of framework.records) {
        expect(record).toHaveProperty('status');
        expect(record).toHaveProperty('rationale');

        for (const relationship of record.relationships ?? []) {
          if (relationship.relation !== 'documentation') continue;
          documentationRelationships += 1;

          const native = relationship.to?.native ?? '';
          for (const retiredPath of retired) expect(native, `${record.id}: ${native}`).not.toContain(retiredPath);

          const separator = native.indexOf('#');
          expect(separator, `${record.id}: ${native}`).toBeGreaterThan(0);

          const documentPath = native.slice(0, separator);
          const fragment = native.slice(separator + 1);
          expect(existsSync(join(root, documentPath)), `${record.id}: ${native}`).toBe(true);
          expect(anchors(documentPath).has(fragment), `${record.id}: ${native}`).toBe(true);
        }
      }
    }

    expect(documentationRelationships).toBeGreaterThan(0);
  });

  it('removes historical implementation narration from top-level governance authorities', () => {
    const markdownFiles = readdirSync(governanceRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => `docs/governance/${entry.name}`);

    for (const path of markdownFiles) {
      const text = read(path);
      expect(text, path).not.toMatch(/\bDEMO-\d{3,}\b/);
      expect(text, path).not.toMatch(/\b(?:PR|pull request)\s*#\d+\b/i);
      expect(text, path).not.toMatch(/\b[0-9a-f]{40}\b/i);
      for (const retiredPath of retired) {
        expect(text, path).not.toContain(retiredPath);
        expect(text, path).not.toContain(retiredPath.split('/').at(-1));
      }
    }
  });

  it('uses structured relationships rather than a manually maintained clause map', () => {
    const validator = read('scripts/validate-assurance-documentation.mjs');
    expect(validator).not.toContain('controlsInAlignment');
    expect(validator).not.toContain('referencedGoverningPaths');
    expect(validator).not.toContain('CONTROL-AND-DOCUMENT-INDEX.md');

    for (const path of canonical) expect(read(path), path).not.toMatch(/^\s*(?:[-*]\s*)?(?:\*\*)?Controls:/mi);
  });

  it('records the current ISO 27001 climate-amendment baseline without a certification claim', () => {
    const governance = read('docs/governance/GOVERNANCE.md');
    const registry = JSON.parse(read('assurance/registry.json'));
    const iso27001 = registry.datasets.find((resource) => resource.id === 'compliance.iso-27001');

    expect(governance).toContain('ISO/IEC 27001:2022/Amd 1:2024');
    expect(governance).toContain('https://www.iso.org/standard/88435.html');
    expect(governance.toLowerCase()).toContain('does **not** claim iso/iec 27001 or iso/iec 42001 certification');
    expect(iso27001.framework.qualification).toContain('ISO/IEC 27001:2022/Amd 1:2024');
  });
});
