import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const deployWorkflow = read('.github/workflows/deploy.yml');
const releaseWorkflow = read('.github/workflows/release.yml');
const releaseManagement = read('docs/RELEASE-MANAGEMENT.md');

function stepPosition(name) {
  const marker = `      - name: ${name}\n`;
  return deployWorkflow.indexOf(marker);
}

describe('DEMO-366 published immutable release deployment boundary', () => {
  it('fails closed instead of exposing raw npm Wrangler production deployment', () => {
    expect(pkg.scripts.deploy).toBe('node scripts/refuse-production-deploy.mjs');
    expect(pkg.scripts.deploy).not.toContain('wrangler');

    const result = spawnSync(process.execPath, ['scripts/refuse-production-deploy.mjs'], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Production deployment is release-workflow only.');
  });

  it('requires the requested ref to be the exact annotated semantic tag at checked-out HEAD', () => {
    expect(deployWorkflow).toContain('REQUESTED_RELEASE: ${{ inputs.ref }}');
    expect(deployWorkflow).toContain('^v(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$');
    expect(deployWorkflow).toContain('git cat-file -t "$tag_ref"');
    expect(deployWorkflow).toContain('tag_object="$(git rev-parse "$tag_ref")"');
    expect(deployWorkflow).toContain('tag_commit="$(git rev-parse "$tag_ref^{commit}")"');
    expect(deployWorkflow).toContain('checkout_commit="$(git rev-parse HEAD)"');
    expect(deployWorkflow).toContain('package_version="$(node -p');
    expect(deployWorkflow).toContain('"v$package_version" != "$tag"');
  });

  it('requires an already-published GitHub Release and the same remote annotated tag object and commit', () => {
    expect(deployWorkflow).toContain('repos/$GITHUB_REPOSITORY/releases/tags/$tag');
    expect(deployWorkflow).toContain('"$release_draft" != "false"');
    expect(deployWorkflow).toContain('-z "$release_published_at"');
    expect(deployWorkflow).toContain('repos/$GITHUB_REPOSITORY/git/ref/tags/$tag');
    expect(deployWorkflow).toContain('"$remote_type" != "tag"');
    expect(deployWorkflow).toContain('"$remote_tag_object" != "$tag_object"');
    expect(deployWorkflow).toContain('repos/$GITHUB_REPOSITORY/git/tags/$remote_tag_object');
    expect(deployWorkflow).toContain('"$remote_target_type" != "commit"');
    expect(deployWorkflow).toContain('"$remote_target_commit" != "$checkout_commit"');
  });

  it('keeps every production mutation downstream of published-release verification', () => {
    const verify = stepPosition('Verify published immutable release identity');
    const migrate = stepPosition('Apply production D1 migrations');
    const deploy = stepPosition('Deploy tagged Worker source');
    expect(verify).toBeGreaterThan(-1);
    expect(migrate).toBeGreaterThan(verify);
    expect(deploy).toBeGreaterThan(migrate);
  });

  it('preserves release-triggered deployment and main-only published-tag recovery', () => {
    expect(releaseWorkflow).toContain('uses: ./.github/workflows/deploy.yml');
    expect(releaseWorkflow).toContain('ref: ${{ github.ref_name }}');
    expect(deployWorkflow).toContain('if [[ "$GITHUB_EVENT_NAME" == "workflow_dispatch" ]]');
    expect(deployWorkflow).toContain('"$GITHUB_REF" != "refs/heads/main"');
    expect(deployWorkflow).toContain('elif [[ "$GITHUB_EVENT_NAME" == "push" ]]');
    expect(deployWorkflow).toContain('"$GITHUB_REF" != "refs/tags/$tag"');
    expect(releaseManagement).toContain('already published immutable semantic tag');
  });
});
