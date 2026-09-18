import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { waitForAssuranceRecordPane } from '../scripts/lib/demo-289-content-review.mjs';
import { routeUrl } from '../src/routing/application-routes';

const read = (file) => fs.readFileSync(file, 'utf8');
const releaseWorkflow = read('.github/workflows/release.yml');
const monitorWorkflow = read('.github/workflows/assurance-monitor.yml');
const monitorValidator = read('scripts/validate-assurance-operations.mjs');
const releaseManagement = read('docs/RELEASE-MANAGEMENT.md');
const deployments = read('docs/history/DEPLOYMENTS.md');
const configurationRegister = read('docs/governance/registers/CONFIGURATION-REGISTER.md');

function deploymentRecords(markdown) {
  const headings = [...markdown.matchAll(/^## (DEP-DEMO-\d+)\s*$/gm)];
  return headings.map((heading, index) => {
    const bodyStart = heading.index + heading[0].length;
    const bodyEnd = headings[index + 1]?.index ?? markdown.length;
    const body = markdown.slice(bodyStart, bodyEnd);
    const fields = {};
    for (const field of body.matchAll(/^\*\*([^:]+):\*\*\s*(.+)$/gm)) {
      fields[field[1]] = field[2].trim();
    }
    return { id: heading[1], fields };
  });
}

describe('DEMO-305 release operations acceptance', () => {
  it('publishes release notes from the immutable tag', () => {
    expect(releaseWorkflow).toContain('git show "$GITHUB_REF_NAME:docs/releases/$GITHUB_REF_NAME.md"');
    expect(releaseWorkflow).not.toContain('origin/main:docs/releases/$GITHUB_REF_NAME.md');
  });

  it('keeps deployment records on the documented format and includes v0.24.0', () => {
    const required = ['Product', 'Release', 'Commit', 'Environment', 'Date', 'URL', 'Changes', 'Validation', 'Previous', 'Rollback'];
    for (const field of required) expect(releaseManagement).toContain(`- **${field}:**`);

    const records = deploymentRecords(deployments);
    expect(records.length).toBeGreaterThan(0);
    for (const record of records) {
      for (const field of required) {
        expect(record.fields[field], `${record.id} ${field}`).toBeTruthy();
      }
    }

    const v024 = records.find((record) => record.fields.Release === 'v0.24.0');
    expect(v024?.id).toBe('DEP-DEMO-009');
    expect(v024?.fields.Commit).toContain('7a7fcda1c058540c82c888f5cd1489de153b68e9');
    expect(v024?.fields.Validation).toContain('35296310582');
  });

  it('keeps the restored monitor identified and externally visible on failure', () => {
    expect(monitorValidator).toContain('WizardGangAssuranceMonitor/1.0');
    expect(monitorValidator).toContain('+https://github.com/SouthernGentlemen/wizardgang-architecture-demo');
    expect(monitorWorkflow).toMatch(/issues:\s*write/);
    expect(monitorWorkflow).toContain('Maintain assurance monitor tracking issue');
    expect(monitorWorkflow).toContain("if (status === 'success')");
    expect(monitorWorkflow).toContain('github.rest.issues.create');
    expect(monitorWorkflow).toContain("state: 'open'");
    expect(monitorWorkflow).toContain("state: 'closed'");
  });

  it('checks the committed repository-settings baseline and documents a read-only live comparison', () => {
    const result = spawnSync(process.execPath, ['scripts/validate-github-repository-settings.mjs'], {
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Validated committed GitHub repository-settings baseline');
    expect(configurationRegister).toContain('config/github-repository-settings.json');
    expect(configurationRegister).toContain('npm run validate:repository-settings -- --live');
  });

  it('fails the content review when a selected assurance record pane never renders', async () => {
    const assurancePath = routeUrl('assurance.index');
    const evaluation = waitForAssuranceRecordPane(
      {},
      `${assurancePath}#WCAG-1.1.1`,
      'ar',
      {
        origin: 'http://127.0.0.1:8791',
        assurancePath,
        evaluatePage: async () => ({ ready: false, headingText: '', recordId: '' }),
        sleep: async () => {},
        timeoutMs: 2,
        pollIntervalMs: 1,
      },
    );

    try {
      await evaluation;
      throw new Error('Expected the missing assurance record pane to fail the content review.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).toContain(`page=${routeUrl('assurance.index')}`);
      expect(message).toContain('state=#WCAG-1.1.1 locale=ar record=WCAG-1.1.1');
    }
  });
});
