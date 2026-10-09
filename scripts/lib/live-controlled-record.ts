import { renderControlledRecord } from './controlled-record.ts';
export function liveControlledRecord({ id, version, requestId, previousTag, commits }: { id: string; version: string; requestId: string; previousTag: string; commits: string }) {
  return renderControlledRecord({
    id, type: 'BUILD', summary: `Demonstrate v${version} release lifecycle`,
    change: `Increment the semantic version to ${version} for the authenticated live lifecycle.`,
    reason: `Owner-confirmed /demos#webhooks release request. Previous release: ${previousTag}.\nCommits since ${previousTag}:\n${commits}`,
    impact: 'Package version metadata only; release notes derive from accepted Git/GitHub history.',
    risk: 'Medium',
    controls: '- Keep the isolated PR open until exact-head CI and explicit Merge & Release confirmation.\n- Preserve strict current-base protected squash, managed credentials and immutable tags.',
    validation: '- Read current main, queued and open identity reservations and existing version tags before publication.\n- Locked version-only metadata was generated; exact-head CI and post-merge verification remain required before release.',
    evidence: '- package.json\n- package-lock.json', source: 'direct', release: `v${version}`,
    liveRelease: true, requestId,
  });
}
