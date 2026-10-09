import { normalizeControlledBody, requireMatchingRecord } from './controlled-record.ts';
import { validateControlledPullRequestIdentity } from './controlled-pr-identity.ts';

export interface DeliverySnapshot {
  mainSha: string;
  pr: { number: number; state: string; title: string; body: string; head: { sha: string; ref: string }; base: { sha: string; ref: string }; mergeable: boolean | null };
  identity: Parameters<typeof validateControlledPullRequestIdentity>[0];
  checks: Array<{ name: string; sha: string; conclusion: string | null }>;
  requiredChecks: string[];
  canonicalCi: { sha: string; conclusion: string | null };
}
export function planProtectedSquash(snapshot: DeliverySnapshot, validatedHead: string, validatedBase: string) {
  const { pr, identity, mainSha } = snapshot;
  if (pr.state !== 'open' || pr.base.ref !== 'main' || mainSha !== validatedBase || pr.base.sha !== mainSha || pr.head.sha !== validatedHead || pr.mergeable !== true) {
    throw new Error('PR head, current main, or mergeability changed; revalidate CI on the new exact head.');
  }
  requireMatchingRecord(identity.headSubject, identity.headBody, pr.title, pr.body);
  const errors = validateControlledPullRequestIdentity({ ...identity, branchName: pr.head.ref, title: pr.title, prBody: pr.body });
  if (errors.length) throw new Error(errors.join('\n'));
  if (snapshot.canonicalCi.sha !== validatedHead || snapshot.canonicalCi.conclusion !== 'success') throw new Error('Canonical exact-head CI is not successful.');
  for (const name of new Set(['validate', 'browser', ...snapshot.requiredChecks])) {
    const checks = snapshot.checks.filter((check) => check.name === name && check.sha === validatedHead);
    if (!checks.length || checks.some((check) => check.conclusion !== 'success')) throw new Error(`Required exact-head check ${name} is not successful.`);
  }
  return { sha: validatedHead, merge_method: 'squash', commit_title: identity.headSubject, commit_message: normalizeControlledBody(identity.headBody) };
}

// Both callers use this orchestration. The second full read is intentionally independent.
export async function protectedSquash({ read, merge, validatedHead, validatedBase, apply = false }: {
  read: () => Promise<DeliverySnapshot>;
  merge: (body: ReturnType<typeof planProtectedSquash>) => Promise<{ merged: boolean; sha: string }>;
  validatedHead: string;
  validatedBase: string;
  apply?: boolean;
}) {
  const first = planProtectedSquash(await read(), validatedHead, validatedBase);
  if (!apply) return { plan: first };
  const final = planProtectedSquash(await read(), validatedHead, validatedBase);
  if (JSON.stringify(first) !== JSON.stringify(final)) throw new Error('Controlled merge metadata changed during final re-read.');
  const result = await merge(final);
  if (!result.merged) throw new Error('Provider declined protected squash; leave PR recoverable.');
  return { plan: final, sha: result.sha };
}

export function verifyMergedIdentity({ subject, body, parent, planMarkdown }: { subject: string; body: string; parent: string; planMarkdown: string }, expected: { subject: string; body: string; base: string; planMarkdown: string }) {
  requireMatchingRecord(expected.subject, expected.body, subject, body);
  if (parent !== expected.base || planMarkdown !== expected.planMarkdown) throw new Error('Merged main parent or queue transition differs from the validated head.');
}
