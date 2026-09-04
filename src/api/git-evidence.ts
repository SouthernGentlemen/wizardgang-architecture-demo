import type { Env } from '../types';
import { authorize } from '../lib/authorization';
import { collectGitHubEvidence, GitHubEvidenceAccessError } from '../lib/github-api';
import { json, methodNotAllowed } from '../lib/http';

function accessError(error: GitHubEvidenceAccessError): Response {
  const headers: Record<string, string> = { 'cache-control': 'no-store' };
  if (error.status === 401) headers['www-authenticate'] = 'Bearer realm="WizardGang protected reporting"';
  return json({ error: error.code }, { status: error.status, headers });
}

export async function gitEvidenceResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  const principal = await authorize(request, env, 'demo:read', { allowIdentitySession: true });
  if (principal instanceof Response) return principal;
  try {
    const evidence = await collectGitHubEvidence(env, principal);
    return json(evidence, {
      headers: {
        'cache-control': evidence.repository.private ? 'private, no-store' : 'public, max-age=60, stale-if-error=300',
        ...(evidence.repository.private ? { vary: 'Authorization, Cookie' } : {}),
      },
    });
  } catch (error) {
    if (error instanceof GitHubEvidenceAccessError) return accessError(error);
    return json({ error: 'github_evidence_unavailable', detail: 'The configured repository could not be queried.' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
