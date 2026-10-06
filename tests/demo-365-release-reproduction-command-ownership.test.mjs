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

  it('shares a fresh migrated local D1 store with browser audits and clears it before the independent migration gate', () => {
    const reproduce = namedStep(releaseWorkflow, 'Reproduce the tagged state');
    const ordered = [
      'local_d1_dir="$(mktemp -d)"',
      'trap \'rm -rf -- "$local_d1_dir"\' EXIT',
      'export WG_LOCAL_D1_PERSIST_TO="$local_d1_dir"',
      'npm run check',
      'unset WG_LOCAL_D1_PERSIST_TO',
      'npm run validate:migrations',
    ];
    let position = -1;
    for (const part of ordered) {
      const next = reproduce.indexOf(part, position + 1);
      expect(next, `${part} must follow the preceding release reproduction step`).toBeGreaterThan(position);
      position = next;
    }
    expect(releaseManagement).toContain('one fresh temporary local D1 persistence directory');
  });

  it('starts generated notes at the closest published release when an intervening tag did not publish', () => {
    expect(releaseWorkflow).toContain('candidate="$(git describe --tags --abbrev=0 "$search_commit"');
    expect(releaseWorkflow).toContain('repos/$GITHUB_REPOSITORY/releases/tags/$candidate');
    expect(releaseWorkflow).toContain('previous_tag="$candidate"');
    expect(releaseWorkflow).toContain('search_commit="$(git rev-list -n 1 "$candidate")^"');
    expect(releaseManagement).toContain('skipping tags whose Release did not publish');
  });

  it('retains locked installation, exact release identity, publication, and deploy ordering', () => {
    expect(releaseWorkflow).toContain('- name: Install locked dependencies\n        run: npm ci');
    expect(releaseWorkflow).toContain('Verify annotated semantic release identity');
    expect(releaseWorkflow).toContain('git cat-file -t "$tag_ref"');
    expect(releaseWorkflow).toContain('checkout_commit="$(git rev-parse HEAD)"');
    expect(releaseWorkflow).toContain('package_version="$(node scripts/release-workflow.ts package-version < package.json)"');
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
