import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/ci.yml'), 'utf8');
const lines = workflow.split('\n');
function job(name: string): string {
  const start = lines.findIndex((line) => line === `  ${name}:`);
  if (start < 0) return '';
  const end = lines.findIndex((line, index) => index > start && /^  [a-z0-9-]+:$/.test(line));
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
}

describe('two executable required acceptance jobs', () => {
  it('runs exactly source validate and browser on PRs and main', () => {
    expect(workflow.split('jobs:\n')[1].split('\n').filter((line) => /^  [a-z0-9-]+:$/.test(line))).toEqual(['  validate:', '  browser:']);
    for (const name of ['validate', 'browser']) {
      expect(job(name)).toContain('ref: ${{ github.event.pull_request.head.sha || github.sha }}');
      expect(job(name)).toContain('timeout-minutes: 15');
      expect(job(name)).toContain(`npm run validate:ci -- ${name === 'validate' ? 'source' : 'browser'}`);
      expect(job(name)).toContain('if: failure()');
    }
    expect(job('browser')).toContain('needs: validate');
    const upload = job('validate').split('- name: Upload prepared browser inputs')[1];
    expect(upload).toContain('include-hidden-files: true');
    expect(workflow).toContain("cancel-in-progress: ${{ github.event_name == 'pull_request' }}");
    expect(workflow).toContain('github.event.pull_request.number || github.sha');
    expect(workflow).toContain('browser-inputs-${{ github.run_id }}-${{ github.event.pull_request.head.sha || github.sha }}');
    expect(workflow).not.toContain('run-id:'); // Download stays within this producing run.
  });
});
