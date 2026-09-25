import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { verifyCloudflareDeployment } from '../scripts/verify-cloudflare-deployment.mjs';

const read = (file) => fs.readFileSync(file, 'utf8');
const deployWorkflow = read('.github/workflows/deploy.yml');
const releaseWorkflow = read('.github/workflows/release.yml');
const releaseManagement = read('docs/RELEASE-MANAGEMENT.md');
const operations = read('docs/OPERATIONS.md');

function stepPosition(name) {
  return deployWorkflow.indexOf('      - name: ' + name + '\n');
}

function deployOutput(versionId = 'version-367') {
  return [
    JSON.stringify({ type: 'wrangler-session', version: 1 }),
    JSON.stringify({
      type: 'deploy',
      version: 1,
      worker_name: 'wizardgang-architecture-demo',
      version_id: versionId,
      targets: ['https://demo.wizardgang.ai'],
    }),
  ].join('\n') + '\n';
}

describe('DEMO-367 release-to-deployment identity and provider version', () => {
  it('keeps publication ahead of the reusable production deployment', () => {
    const publication = releaseWorkflow.indexOf('Publish GitHub Release from tag and GitHub history');
    const deployJob = releaseWorkflow.indexOf('\n  deploy:\n');

    expect(publication).toBeGreaterThan(-1);
    expect(deployJob).toBeGreaterThan(publication);
    expect(releaseWorkflow.slice(deployJob)).toContain('needs: reproduce');
    expect(releaseWorkflow.slice(deployJob)).toContain('uses: ./.github/workflows/deploy.yml');
    expect(releaseWorkflow.slice(deployJob)).toContain('ref: ${{ github.ref_name }}');
  });

  it('keeps requested tag, package, published release, and exact commit continuous through deployment', () => {
    expect(deployWorkflow).toContain('REQUESTED_RELEASE: ${{ inputs.ref }}');
    expect(deployWorkflow).toContain('"v$package_version" != "$tag"');
    expect(deployWorkflow).toContain('repos/$GITHUB_REPOSITORY/releases/tags/$tag');
    expect(deployWorkflow).toContain('"$release_tag" != "$tag"');
    expect(deployWorkflow).toContain('"$remote_target_commit" != "$checkout_commit"');
    expect(deployWorkflow).toContain('echo "version=${tag#v}" >> "$GITHUB_OUTPUT"');
    expect(deployWorkflow).toContain('echo "sha=$checkout_commit" >> "$GITHUB_OUTPUT"');
    expect(deployWorkflow).toContain('--var DEPLOYED_VERSION:${{ steps.release.outputs.version }}');
    expect(deployWorkflow).toContain('--var DEPLOYED_SHA:${{ steps.release.outputs.sha }}');
    expect(deployWorkflow).toContain('EXPECTED_VERSION: ${{ steps.release.outputs.version }}');
    expect(deployWorkflow).toContain('EXPECTED_SHA: ${{ steps.release.outputs.sha }}');
  });

  it('does not allow another tag or commit to substitute for the requested published release', () => {
    expect(deployWorkflow).toContain('"$GITHUB_REF" != "refs/tags/$tag" || "$GITHUB_REF_NAME" != "$tag"');
    expect(deployWorkflow).toContain('"$checkout_commit" != "$tag_commit"');
    expect(deployWorkflow).toContain('"$remote_tag_object" != "$tag_object"');
    expect(deployWorkflow).toContain('"$remote_target_commit" != "$checkout_commit"');
    expect(deployWorkflow).toContain('if [[ "$GITHUB_EVENT_NAME" == "workflow_dispatch" ]]');
    expect(deployWorkflow).toContain('"$GITHUB_REF" != "refs/heads/main"');
  });

  it('binds provider verification to the exact Wrangler deployment result before public verification', () => {
    const deploy = stepPosition('Deploy tagged Worker source');
    const provider = stepPosition('Verify Cloudflare deployed version and traffic');
    const publicIdentity = stepPosition('Verify public version, health, and identity continuity');

    expect(deploy).toBeGreaterThan(-1);
    expect(provider).toBeGreaterThan(deploy);
    expect(publicIdentity).toBeGreaterThan(provider);
    expect(deployWorkflow).toContain('WRANGLER_OUTPUT_FILE_PATH: ${{ runner.temp }}/wrangler-deploy.ndjson');
    expect(deployWorkflow).toContain('npx wrangler deployments status --name "$EXPECTED_WORKER_NAME" --json');
    expect(deployWorkflow).toContain('node scripts/verify-cloudflare-deployment.mjs');
  });

  it('accepts only the deployment result as the sole provider version at 100 percent traffic', () => {
    expect(verifyCloudflareDeployment({
      deployOutputText: deployOutput('version-367'),
      deploymentStatus: { versions: [{ version_id: 'version-367', percentage: 100 }] },
      expectedWorkerName: 'wizardgang-architecture-demo',
    })).toEqual({ versionId: 'version-367', percentage: 100 });
  });

  it('fails when provider version or traffic evidence does not identify the deployment result', () => {
    expect(() => verifyCloudflareDeployment({
      deployOutputText: deployOutput('version-367'),
      deploymentStatus: { versions: [{ version_id: 'other-version', percentage: 100 }] },
      expectedWorkerName: 'wizardgang-architecture-demo',
    })).toThrow(/does not match Wrangler deploy result/);

    expect(() => verifyCloudflareDeployment({
      deployOutputText: deployOutput('version-367'),
      deploymentStatus: {
        versions: [
          { version_id: 'version-367', percentage: 90 },
          { version_id: 'other-version', percentage: 10 },
        ],
      },
      expectedWorkerName: 'wizardgang-architecture-demo',
    })).toThrow(/exactly one active production version/);

    expect(() => verifyCloudflareDeployment({
      deployOutputText: JSON.stringify({ type: 'wrangler-session', version: 1 }) + '\n',
      deploymentStatus: { versions: [{ version_id: 'version-367', percentage: 100 }] },
      expectedWorkerName: 'wizardgang-architecture-demo',
    })).toThrow(/exactly one deploy result/);
  });

  it('preserves public release and commit identity verification and documents the provider boundary', () => {
    expect(deployWorkflow).toContain("'https://demo.wizardgang.ai/api/operations/version'");
    expect(deployWorkflow).toContain('metadata.version !== expectedVersion || metadata.commit !== expectedSha');
    expect(deployWorkflow).toContain("'https://demo.wizardgang.ai/api/operations/health'");
    expect(deployWorkflow).toContain("'https://demo.wizardgang.ai/auth/session'");
    expect(deployWorkflow).toContain('Verify deployed static browser assets');
    expect(releaseManagement).toContain('sole version receiving 100% of production traffic');
    expect(operations).toContain('provider-side deployment evidence');
  });
});
