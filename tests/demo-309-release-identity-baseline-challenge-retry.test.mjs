import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('DEMO-309 deployment baseline ownership after shared-platform cut-over', () => {
  it('retires the repository-local identity baseline retry with the local deploy workflow', () => {
    const release = fs.readFileSync('.github/workflows/release.yml', 'utf8');
    expect(fs.existsSync('.github/workflows/deploy.yml')).toBe(false);
    expect(release).toContain('uses: Wizard-Gang/baseline/.github/workflows/deploy-worker.yml@5e3847c8cf0072fa9698aa8e5e141f96e00d73bb');
    expect(release).not.toContain('Capture pre-deployment identity baseline');
    expect(release).not.toContain('cf-mitigated');
  });
});
