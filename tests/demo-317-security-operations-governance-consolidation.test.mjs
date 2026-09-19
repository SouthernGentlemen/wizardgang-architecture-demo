import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const governanceRoot = join(root, 'docs/governance');
const canonical = [
  'docs/governance/SECURITY-GOVERNANCE.md',
  'docs/governance/AI-GOVERNANCE.md',
  'docs/governance/DATA-AND-PRIVACY.md',
  'docs/governance/INCIDENT-AND-CONTINUITY.md',
  'docs/governance/ENGINEERING-CONTROLS.md',
];
const retired = [
  'docs/governance/AI-POLICY.md',
  'docs/governance/INFORMATION-SECURITY-POLICY.md',
  'docs/governance/ASSET-ACCESS-ACCEPTABLE-USE.md',
  'docs/governance/BACKUP-RECOVERY-RESTORE.md',
  'docs/governance/CONTINUITY-RESILIENCE.md',
  'docs/governance/CONFIGURATION-BASELINE-DRIFT.md',
  'docs/governance/CRYPTOGRAPHY-SECRETS-KEY-MANAGEMENT.md',
  'docs/governance/DATA-GOVERNANCE.md',
  'docs/governance/INCIDENT-MANAGEMENT.md',
  'docs/governance/LEGAL-CONTRACTUAL-IP-PRIVACY.md',
  'docs/governance/SECURE-ENGINEERING-TESTING.md',
  'docs/governance/SUPPLIER-AND-EXTERNAL-SERVICE-MANAGEMENT.md',
  'docs/governance/VULNERABILITY-THREAT-SECURITY-MAINTENANCE.md',
];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function githubSlug(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\x60/g, '')
    .replace(/[*_~]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function anchors(markdown) {
  const result = new Set();
  const counts = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const base = githubSlug(match[1]);
    const duplicate = counts.get(base) ?? 0;
    counts.set(base, duplicate + 1);
    result.add(duplicate === 0 ? base : base + '-' + duplicate);
  }
  return result;
}

describe('DEMO-317 security and operational governance consolidation', () => {
  it('reduces current top-level governance to three management-system and five operational authorities', () => {
    for (const path of canonical) expect(existsSync(join(root, path)), path).toBe(true);
    for (const path of retired) expect(existsSync(join(root, path)), path).toBe(false);
    const topLevel = readdirSync(governanceRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
    expect(topLevel).toHaveLength(8);
  });

  it('keeps one current document identity for each consolidated operational domain', () => {
    const registry = JSON.parse(read('docs/governance/REFERENCE-REGISTRY.json'));
    const byReference = new Map(registry.records.map((record) => [record.reference, record.path]));
    expect(byReference.get('WG-POL-001')).toBe('docs/governance/SECURITY-GOVERNANCE.md');
    expect(byReference.get('WG-POL-002')).toBe('docs/governance/AI-GOVERNANCE.md');
    expect(byReference.get('WG-GOV-020')).toBe('docs/governance/DATA-AND-PRIVACY.md');
    expect(byReference.get('WG-GOV-017')).toBe('docs/governance/INCIDENT-AND-CONTINUITY.md');
    expect(byReference.get('WG-GOV-026')).toBe('docs/governance/ENGINEERING-CONTROLS.md');
    for (const path of retired) expect(registry.records.some((record) => record.path === path), path).toBe(false);
  });

  it('remaps compliance documentation edges to live consolidated headings', () => {
    for (const path of ['assurance/compliance/iso-27001-2022.json', 'assurance/compliance/iso-42001-2023.json']) {
      const framework = JSON.parse(read(path));
      for (const record of framework.records) {
        for (const relationship of record.relationships ?? []) {
          if (relationship.relation !== 'documentation') continue;
          const native = relationship.to?.native ?? '';
          for (const retiredPath of retired) expect(native).not.toContain(retiredPath);
          const split = native.indexOf('#');
          expect(split, record.id + ': ' + native).toBeGreaterThan(0);
          const documentPath = native.slice(0, split);
          const anchor = native.slice(split + 1);
          expect(existsSync(join(root, documentPath)), record.id + ': ' + native).toBe(true);
          expect(anchors(read(documentPath)).has(anchor), record.id + ': ' + native).toBe(true);
        }
      }
    }
  });

  it('removes the retired broad credential from current inventory and keeps the negative invariant', () => {
    const access = read('assurance/governance/access-classes.json');
    const crypto = read('assurance/governance/cryptography-secrets.json');
    const security = read('docs/governance/SECURITY-GOVERNANCE.md');
    const openapi = read('contracts/openapi/openapi.json');
    for (const text of [access, crypto, security, openapi]) expect(text).not.toContain('DEMO_API_TOKEN');
    expect(access).toContain('no broad operator bearer credential is accepted by the application');
    expect(security).toContain('No broad operator bearer credential is accepted by the application.');
    expect(openapi).toContain('No broad operator bearer credential is accepted by the application.');
  });

  it('removes concrete implementation history from current governance registers and identity prose', () => {
    for (const file of readdirSync(join(root, 'assurance/governance')).filter((name) => name.endsWith('.json'))) {
      expect(read('assurance/governance/' + file), file).not.toMatch(/\bDEMO-\d{3,}\b/);
    }
    expect(read('docs/IDENTITY.md')).not.toContain('one-time sandbox reset');
    expect(read('docs/IDENTITY.md')).not.toContain('pre-change short-lived demo access tokens');
  });

  it('keeps detailed change and release mechanics in their existing authorities', () => {
    const engineering = read('docs/governance/ENGINEERING-CONTROLS.md');
    expect(engineering).toContain('docs/CHANGE-MANAGEMENT.md is the sole detailed authority');
    expect(engineering).toContain('docs/RELEASE-MANAGEMENT.md is the sole detailed authority');
  });
});
