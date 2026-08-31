import type { Env } from './types';
import { routeRequest } from './router';
export { DemoCoordinator } from './durable/demo-coordinator';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return routeRequest(request, env);
  },
};
