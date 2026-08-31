import type { DurableObjectState } from '../types';

/**
 * Minimal coordinated-state primitive for the /durable-objects demo.
 * Keep this class intentionally small so the public source clearly shows
 * what Durable Objects add beyond stateless Worker requests.
 */
export class DemoCoordinator {
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname.endsWith('/increment')) {
      let next = 0;
      const previous = this.queue;
      let release = () => {};
      this.queue = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      try {
        const current = (await this.state.storage.get<number>('counter')) ?? 0;
        next = current + 1;
        await this.state.storage.put('counter', next);
      } finally {
        release();
      }
      return Response.json({ counter: next });
    }

    const counter = (await this.state.storage.get<number>('counter')) ?? 0;
    return Response.json({ counter });
  }
}
