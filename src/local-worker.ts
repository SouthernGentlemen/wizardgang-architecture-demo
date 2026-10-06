import { createDemoWorker, demoApplicationFetch, DEMO_ROBOTS, type DemoWorkerEnv } from './index';
import { createEdge, type EdgeHandler, type Release } from '#wg-edge';

// Generated development entries alone import this adapter. Release entries use the strict shell directly.
export function createLocalDemoWorker(release: Release): EdgeHandler<DemoWorkerEnv> {
  if (release.version !== '0.0.0-dev') throw new Error('The local Worker requires development identity');
  const worker = createDemoWorker(release);
  return {
    ...worker,
    async fetch(request, env, context) {
      const local = new URL(request.url);
      // Wrangler presents the configured custom-domain host even on its loopback listener.
      if (!['127.0.0.1', 'localhost', '[::1]', 'demo.wizardgang.ai'].includes(local.hostname)) {
        return worker.fetch(request, env, context);
      }
      const canonical = new URL(local);
      canonical.protocol = 'https:';
      canonical.host = 'demo.wizardgang.ai';
      const headers = new Headers(request.headers);
      headers.delete('cf-visitor');
      headers.delete('x-forwarded-proto');
      // The shell sees its declared HTTPS host; app same-origin checks and redirects see the real local URL.
      const localShell = createEdge<DemoWorkerEnv>({
        release, robots: DEMO_ROBOTS,
        fetch(_canonicalRequest, bindings, _context, edge) {
          return demoApplicationFetch(request, bindings, edge);
        },
      });
      return localShell.fetch(new Request(canonical, new Request(request.clone(), { headers })), env, context);
    },
  };
}
