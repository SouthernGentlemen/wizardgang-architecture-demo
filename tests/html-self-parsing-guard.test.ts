import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : /\.tsx?$/.test(target) ? [target] : [];
  });
}

describe('page composition source boundary', () => {
  it('does not parse or rewrite locally rendered shell HTML', () => {
    for (const file of sourceFiles('src')) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/indexOf\(\s*['"]<main/);
      expect(source, file).not.toMatch(/\.replace\(\s*['"]\s*<link rel=[\"']icon/);
      expect(source, file).not.toMatch(/\.replace\(\s*['"]<html lang=/);
      expect(source, file).not.toMatch(/import\s*\{[^}]*\bshell\b[^}]*\}\s*from/);
    }
  });

  it('keeps React document rendering behind renderPage', () => {
    const source = fs.readFileSync('src/ui/page.ts', 'utf8');
    const documentSource = fs.readFileSync('src/ui/document.tsx', 'utf8');
    expect(source).toContain('export function renderPage(env: Env, content: PageContent): Response');
    expect(source).toContain('renderDocument(env, content, localization)');
    expect(documentSource).toContain('renderToStaticMarkup(<LocalizedDocument');
    expect(documentSource).not.toContain('localizePresentation');
  });

  it('confines raw HTML to the audited legacy-body component', () => {
    const uses: string[] = [];
    for (const file of sourceFiles('src')) {
      const source = fs.readFileSync(file, 'utf8');
      if (source.includes('dangerouslySetInnerHTML')) uses.push(file);
    }
    expect(uses).toEqual(['src/ui/legacy-body.tsx']);
  });
});
