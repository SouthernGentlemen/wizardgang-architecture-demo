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

  it('keeps full-document rendering behind the React-only page boundary', () => {
    const source = fs.readFileSync('src/ui/page.ts', 'utf8');
    const documentSource = fs.readFileSync('src/ui/document.tsx', 'utf8');
    expect(source).toContain('export function renderReactPage(env: Env, content: ReactPageContent): Response');
    expect(source).toContain('renderDocument(env, content, localization)');
    expect(source).not.toContain('export function renderPage(');
    expect(documentSource).toContain('renderToStaticMarkup(<LocalizedDocument');
    expect(documentSource).not.toContain('localizePresentation');
  });

  it('keeps raw HTML injection out of all application source', () => {
    const uses: string[] = [];
    for (const file of sourceFiles('src')) {
      const source = fs.readFileSync(file, 'utf8');
      if (source.includes('dangerouslySetInnerHTML')) uses.push(file);
    }
    expect(uses).toEqual([]);
  });
});
