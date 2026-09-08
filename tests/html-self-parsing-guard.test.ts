import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? sourceFiles(target) : target.endsWith('.ts') ? [target] : [];
  });
}

describe('page composition source boundary', () => {
  it('does not parse or rewrite locally rendered shell HTML', () => {
    for (const file of sourceFiles('src')) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/indexOf\(\s*['"]<main/);
      expect(source, file).not.toMatch(/\.replace\(\s*['"]\s*<link rel=[\"']icon/);
      expect(source, file).not.toMatch(/\.replace\(\s*['"]<html lang=/);
      if (file !== 'src/ui/page.ts') {
        expect(source, file).not.toMatch(/import\s*\{[^}]*\bshell\b[^}]*\}\s*from/);
      }
    }
  });

  it('keeps the shell private to renderPage', () => {
    const source = fs.readFileSync('src/ui/page.ts', 'utf8');
    expect(source.match(/\bshell\(env,/g)).toHaveLength(1);
    expect(source).toContain('export function renderPage(env: Env, content: PageContent): Response');
  });
});
