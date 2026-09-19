import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const accessibilityPath = 'docs/ACCESSIBILITY.md';
const i18nPath = 'docs/INTERNATIONALIZATION.md';
const retiredVerificationPath = 'docs/SITE-ACCESSIBILITY-VERIFICATION.md';

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function currentStateMarkdown() {
  const files = ['README.md', 'AGENTS.md'];
  const walk = (directory) => {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (
          path === 'docs/history'
          || path === 'docs/governance/assessments'
          || path === 'docs/governance/evaluations'
        ) continue;
        walk(path);
      } else if (entry.name.endsWith('.md')) {
        files.push(relative(root, join(root, path)).replaceAll('\\', '/'));
      }
    }
  };

  walk('docs');
  return [...new Set(files)];
}

describe('DEMO-315 accessibility documentation consolidation', () => {
  it('keeps one primary accessibility architecture document and retires the redundant site verification document', () => {
    expect(existsSync(join(root, accessibilityPath))).toBe(true);
    expect(existsSync(join(root, retiredVerificationPath))).toBe(false);

    const offenders = currentStateMarkdown()
      .filter((path) => read(path).includes(retiredVerificationPath));
    expect(offenders).toEqual([]);
  });

  it('keeps accessibility architecture current-state only and criterion state in structured assurance', () => {
    const accessibility = read(accessibilityPath);

    expect(accessibility).not.toMatch(/\bDEMO-\d+\b/);
    expect(accessibility).toContain('assurance/compliance/wcag-2.2.json');
    expect(accessibility).toContain('assurance/compliance/wcag-2.2/');
    expect(accessibility).toContain('docs/accessibility-manual-verification.json');
    expect(accessibility).not.toContain('Registry status vocabulary');
    expect(accessibility).not.toContain('| Criterion | Status |');
  });

  it('keeps automated, source, human, assistive-technology, and conformance boundaries explicit', () => {
    const accessibility = read(accessibilityPath).toLowerCase();

    expect(accessibility).toContain('automated repository and browser evidence');
    expect(accessibility).toContain('source and content review');
    expect(accessibility).toContain('human visual and manual browser review');
    expect(accessibility).toContain('assistive-technology and environment-specific testing');
    expect(accessibility).toContain('conformance boundary');
    expect(accessibility).toContain('does not claim wcag 2.2 level a, aa, or aaa conformance or certification');
  });

  it('keeps localization documentation limited to the distinct runtime contract', () => {
    const i18n = read(i18nPath);

    expect(i18n).not.toMatch(/\bDEMO-\d+\b/);
    expect(i18n).toContain('docs/ACCESSIBILITY.md');
    expect(i18n).toContain('npm run validate:locales');
    expect(i18n).toContain('npm run validate:site-i18n');
    expect(i18n).not.toContain('axe-core');
    expect(i18n).not.toContain('forced-colors');
    expect(i18n).not.toContain('screen-reader');
    expect(i18n).not.toContain('npm run test:site-accessibility');
  });

  it('keeps current WCAG manifest prose free of implementation-story identifiers', () => {
    const manifest = read('assurance/compliance/wcag-2.2.json');
    expect(manifest).not.toMatch(/\bDEMO-\d+\b/);
    expect(manifest).toContain('"normative": "https://www.w3.org/TR/WCAG22/"');
  });
});
