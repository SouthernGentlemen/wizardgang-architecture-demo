import type { Env } from '../types';
import { json, methodNotAllowed } from '../lib/http';
import { collectGitHubEvidence } from '../lib/github-api';

export async function gitEvidenceResponse(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return methodNotAllowed(['GET']);
  try {
    return json(await collectGitHubEvidence(env), {
      headers: { 'cache-control': 'public, max-age=60, stale-if-error=300' },
    });
  } catch {
    return json({ error: 'github_evidence_unavailable', detail: 'The configured public repository could not be queried.' }, {
      status: 503,
      headers: { 'cache-control': 'no-store' },
    });
  }
}
