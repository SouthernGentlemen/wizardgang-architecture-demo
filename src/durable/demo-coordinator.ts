import type { DurableObjectState } from '../types';

/**
 * Minimal coordinated-state primitive for the /durable-objects demo.
 * Keep this class intentionally small so the public source clearly shows
 * what Durable Objects add beyond stateless Worker requests.
 */
export class DemoCoordinator {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname.endsWith('/increment')) {
      const current = (await this.state.storage.get<number>('counter')) ?? 0;
      const next = current + 1;
      await this.state.storage.put('counter', next);
      return Response.json({ counter: next });
    }

    const counter = (await this.state.storage.get<number>('counter')) ?? 0;
    return Response.json({ counter });
  }
}
