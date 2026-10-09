import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (file: string) => fs.readFileSync(file, 'utf8');
const releaseWorkflow = read('.github/workflows/release.yml');
const monitorWorkflow = read('.github/workflows/assurance-monitor.yml');
const monitorValidator = read('scripts/validate-assurance-operations.ts');
const repositorySettingsValidator = read('scripts/validate-github-repository-settings.ts');

describe('DEMO-305 release operations acceptance', () => {
  it('publishes release notes from the annotated tag and GitHub history', () => {
    expect(releaseWorkflow).toContain('Verify annotated semantic release identity');
    expect(releaseWorkflow).toContain('git cat-file -t "$tag_ref"');
    expect(releaseWorkflow).toContain('tag_commit="$(git rev-list -n 1 "$GITHUB_REF_NAME")"');
    expect(releaseWorkflow).toContain('checkout_commit="$(git rev-parse HEAD)"');
    expect(releaseWorkflow).toContain('--generate-notes');
    expect(releaseWorkflow).toContain('--notes-start-tag "$PREVIOUS_TAG"');
    expect(releaseWorkflow).toContain('--verify-tag');
    expect(releaseWorkflow).not.toContain(['docs', 'releases'].join('/'));
  });

  it('keeps the restored monitor identified and externally visible on failure', () => {
    expect(monitorValidator).toContain('WizardGangAssuranceMonitor/1.0');
    expect(monitorValidator).toContain('+https://github.com/Wizard-Gang/wizardgang-architecture-demo');
    expect(monitorWorkflow).toMatch(/issues:\s*write/);
    expect(monitorWorkflow).toContain('Maintain assurance monitor tracking issue');
    expect(monitorWorkflow).toContain("if (status === 'success')");
    expect(monitorWorkflow).toContain('github.rest.issues.create');
    expect(monitorWorkflow).toContain("state: 'open'");
    expect(monitorWorkflow).toContain("state: 'closed'");
  });

  it('retains the committed repository-settings baseline and read-only live comparison contract', () => {
    expect(repositorySettingsValidator).toContain('config/github-repository-settings.json');
    expect(repositorySettingsValidator).toContain("process.argv.includes('--live')");
  });

});
