import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const oldRegisterRoot = ['docs', 'governance', 'registers'].join('/');
const oldSoaRoot = ['docs', 'governance', 'soa'].join('/');

function readJson(path: string): any {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function walk(path: string): string[] {
  const absolute = join(root, path);
  if (!existsSync(absolute)) return [];
  if (!statSync(absolute).isDirectory()) return [path];
  return readdirSync(absolute).flatMap((name) => walk(join(path, name)));
}

describe('structured assurance source of truth', () => {
  it('does not keep committed register or SoA Markdown projection directories', () => {
    expect(existsSync(join(root, oldRegisterRoot))).toBe(false);
    expect(existsSync(join(root, oldSoaRoot))).toBe(false);
  });

  it('keeps current-state docs and runtime source free of retired projection authorities', () => {
    const candidates = [
      'AGENTS.md',
      'README.md',
      'package.json',
      ...walk('docs').filter((path) => !path.startsWith('docs/governance/assessments/')),
      ...walk('src'),
      ...walk('assurance'),
      ...walk('contracts'),
    ].filter((path) => /\.(?:md|json|jsonc|js|mjs|ts|tsx)$/.test(path) || path === 'package.json');

    const offenders = candidates.filter((path) => {
      const text = readFileSync(join(root, path), 'utf8');
      return text.includes(oldRegisterRoot + '/')
        || text.includes(oldSoaRoot + '/')
        || /(?:^|[`\s(])registers\/[^`\s)]+\.md/.test(text)
        || /(?:^|[`\s(])soa\/ISO-[^`\s)]+\.md/.test(text);
    });

    expect(offenders).toEqual([]);
  });

  it('resolves every stable register, objective, and SoA identity to structured assurance', () => {
    const referenceRegistry = readJson('docs/governance/REFERENCE-REGISTRY.json');
    const structured = referenceRegistry.records.filter((record: any) => /^WG-(?:REG|OBJ|SOA)-/.test(record.reference));
    expect(structured).toHaveLength(16);
    expect(structured.every((record: any) => record.path.startsWith('assurance/') && record.path.endsWith('.json'))).toBe(true);
  });

  it('uses structured presentation identities without historical PR or merge provenance', () => {
    const presentation = readJson('assurance/presentation/documents.json');
    const ids = presentation.documents.map((document: any) => document.id);
    expect(ids).toHaveLength(16);
    expect(new Set(ids).size).toBe(16);
    for (const document of presentation.documents) {
      expect(document).not.toHaveProperty('governanceDocumentReference');
      expect(document).not.toHaveProperty('approval');
      expect(JSON.stringify(document)).not.toContain('pullRequest');
      expect(JSON.stringify(document)).not.toContain('mergeCommit');
      expect(document.sourceDatasets.length).toBeGreaterThan(0);
    }
  });

  it('keeps generated-artifact parity focused on legitimate generated outputs', () => {
    const validator = readFileSync(join(root, 'scripts/validate-generated-artifacts.mjs'), 'utf8');
    expect(validator).not.toContain('assurance-summaries');
    expect(validator).not.toContain('governance-registers');
    expect(validator).not.toContain(oldRegisterRoot + '/');
    expect(validator).not.toContain(oldSoaRoot + '/');
  });

  it('keeps documentation relationships on governing Markdown, never retired projections', () => {
    for (const path of ['assurance/compliance/iso-27001-2022.json', 'assurance/compliance/iso-42001-2023.json']) {
      const data = readJson(path);
      for (const record of data.records) {
        for (const edge of record.relationships ?? []) {
          if (edge.relation !== 'documentation') continue;
          expect(edge.to.native).toMatch(/^docs\/.*\.md#/);
          expect(edge.to.native.startsWith(oldRegisterRoot + '/')).toBe(false);
          expect(edge.to.native.startsWith(oldSoaRoot + '/')).toBe(false);
        }
      }
    }
  });

  it('keeps the workbench SoA presentation bound to canonical structured compliance sources', () => {
    const source = readFileSync(join(root, 'src/demos/assurance-workbench.ts'), 'utf8');
    expect(source).toContain('assurance/compliance/iso-27001-2022.json');
    expect(source).toContain('assurance/compliance/iso-42001-2023.json');
    expect(source).not.toContain(oldSoaRoot + '/');
  });
});
