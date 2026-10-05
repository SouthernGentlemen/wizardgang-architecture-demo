import { describe, expect, it } from 'vitest';
import { AVAILABILITY_RETENTION_DAYS, healthResponse } from '../src/api/operations';
import { runScheduledOperations } from '../src/index';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';

const DAY_MS = 86_400_000;

function env(): Env & { WG_DB: SqliteD1 } {
  return { WG_DB: new SqliteD1(), GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo', GITHUB_BRANCH: 'main' };
}

describe('availability history integrity', () => {
  it('keeps interactive health reads read-only', async () => {
    const environment = env();
    const response = await healthResponse(environment);
    expect(response.status).toBe(200);
    expect(environment.WG_DB.queries.some((query) => !query.startsWith('SELECT'))).toBe(false);
    expect(environment.WG_DB.records('health').size).toBe(0);
    expect(environment.WG_DB.records('availability').size).toBe(0);
  });

  it('stores one deterministic scheduled slot per retry and counts it once in its day', async () => {
    const environment = env();
    const scheduledTime = Date.parse('2026-09-09T12:05:00.000Z');
    await runScheduledOperations(environment, scheduledTime);
    await runScheduledOperations(environment, scheduledTime);
    const health = environment.WG_DB.records<{ scheduledAt: string; status: string; intentionalOffline: boolean }>('health');
    expect([...health.keys()]).toEqual(['2026-09-09T12:05:00.000Z']);
    const slot = health.get('2026-09-09T12:05:00.000Z')!;
    expect(slot.owner).toBe('2026-09-09');
    expect(slot.body).toMatchObject({ scheduledAt: '2026-09-09T12:05:00.000Z', status: 'operational', intentionalOffline: false });
    expect(slot.expiresAt).not.toBeNull();

    await runScheduledOperations(environment, Date.parse('2026-09-09T12:10:00.000Z'));
    const day = environment.WG_DB.records('availability').get('2026-09-09')!;
    expect(day.body).toEqual({ verified: 2, operational: 2, intentional: 0 });
    expect(day.expiresAt! - Date.now()).toBeGreaterThan((AVAILABILITY_RETENTION_DAYS - 1) * DAY_MS);
    expect(AVAILABILITY_RETENTION_DAYS).toBe(365);
  });

  it('adds live slots to imported counts and sweeps expired rows', async () => {
    const environment = env();
    environment.WG_DB.putRecord('availability', '2026-09-09', { verified: 0, operational: 0, intentional: 0, imported: { verified: 10, operational: 9, intentional: 1 } });
    environment.WG_DB.putRecord('availability', '2025-01-01', { verified: 1, operational: 1, intentional: 0 }, { expiresAt: 1 });
    await runScheduledOperations(environment, Date.parse('2026-09-09T12:05:00.000Z'));
    const days = environment.WG_DB.records('availability');
    expect(days.get('2026-09-09')?.body).toEqual({ verified: 11, operational: 10, intentional: 1, imported: { verified: 10, operational: 9, intentional: 1 } });
    expect(days.has('2025-01-01')).toBe(false);
  });
});
