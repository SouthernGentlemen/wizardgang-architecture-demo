export interface AdminIdentity { username: string; }

export function requireAdmin(authorized: boolean): AdminIdentity | Response {
  if (authorized) return { username: 'ops' };
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'www-authenticate': 'Basic realm="WizardGang Ops", charset="UTF-8"',
      'cache-control': 'no-store',
    },
  });
}

export function requireSameOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin');
  const expected = new URL(request.url).origin;
  if (!origin || origin !== expected) {
    return new Response('A same-origin form submission is required.', {
      status: 403,
      headers: { 'cache-control': 'no-store' },
    });
  }
  return null;
}
