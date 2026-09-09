import type { Env } from './types';
import { routeRequest } from './router';
import { collectHealth, purgeAvailabilityHistory } from './api/operations';
export { DemoCoordinator } from './durable/demo-coordinator';

interface ScheduledController {
  scheduledTime: number;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

export async function runScheduledOperations(env: Env, scheduledTime = Date.now()): Promise<void> {
  await collectHealth(env, true, scheduledTime);
  await purgeAvailabilityHistory(env, scheduledTime);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return routeRequest(request, env);
  },
  async scheduled(controller: ScheduledController, env: Env, context: ExecutionContext): Promise<void> {
    context.waitUntil(runScheduledOperations(env, controller.scheduledTime));
  },
};
