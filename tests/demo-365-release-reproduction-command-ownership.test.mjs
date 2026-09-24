import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const releaseWorkflow = read('.github/workflows/release.yml');
const releaseManagement = read('docs/RELEASE-MANAGEMENT.md');
const canonicalAdvisory = 'security:dependency-advisories';
const staleAdvisory = ['security', 'dependencies'].join(':');

function namedStep(workflow, name) {
  const marker = `      - name: ${name}\n`;
  const start = workflow.indexOf(marker);
  if (start < 0) return '';
  const next = workflow.indexOf('\n      - name:', start + marker.length);
  return workflow.slice(start, next < 0 ? workflow.length : next);
}

describe('DEMO-365 exact release reproduction command ownership', () => {
  it('keeps every tagged reproduction npm command executable from package.json', () => {
    const reproduce = namedStep(releaseWorkflow, 'Reproduce the tagged state');
    expect(reproduce).not.toBe('');
    const commands = [...reproduce.matchAll(/^\s+npm run ([A-Za-z0-9:_-]+)\s*$/gm)].map((match) => match[1]);

    expect(commands).toEqual([
      'check',
      'validate:migrations',
      canonicalAdvisory,
      'build',
    ]);
    for (const command of commands) {
      expect(pkg.scripts?.[command], `missing package.json script: ${command}`).toEqual(expect.any(String));
      expect(pkg.scripts[command].trim()).not.toBe('');
    }
    expect(commands.filter((command) => command === canonicalAdvisory)).toHaveLength(1);
  });

  it('retains locked installation, exact release identity, publication, and deploy ordering', () => {
    expect(releaseWorkflow).toContain('- name: Install locked dependencies\n        run: npm ci');
    expect(releaseWorkflow).toContain('Verify annotated semantic release identity');
    expect(releaseWorkflow).toContain('git cat-file -t "$tag_ref"');
    expect(releaseWorkflow).toContain('checkout_commit="$(git rev-parse HEAD)"');
    expect(releaseWorkflow).toContain('package_version="$(node -p');
    expect(releaseWorkflow).toContain('Publish GitHub Release from tag and GitHub history');
    expect(releaseWorkflow).toContain('gh release create "${release_args[@]}"');

    const publication = releaseWorkflow.indexOf('Publish GitHub Release from tag and GitHub history');
    const deployJob = releaseWorkflow.indexOf('\n  deploy:\n');
    expect(publication).toBeGreaterThan(-1);
    expect(deployJob).toBeGreaterThan(publication);
    expect(releaseWorkflow.slice(deployJob)).toContain('needs: reproduce');
  });

  it('uses the canonical advisory name in release policy and leaves no stale command name tracked', () => {
    expect(releaseManagement).toContain(`npm run ${canonicalAdvisory}`);
    expect(releaseWorkflow).not.toContain(staleAdvisory);
    expect(releaseManagement).not.toContain(staleAdvisory);

    const grep = spawnSync('git', ['grep', '-n', '-F', staleAdvisory, '--'], { encoding: 'utf8' });
    expect(grep.status, grep.stdout || grep.stderr).toBe(1);
    expect(grep.stdout).toBe('');
  });
});
