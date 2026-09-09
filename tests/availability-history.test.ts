import { describe, expect, it, vi } from 'vitest';
import { availabilityContent } from '../src/demos/availability-page';
import {
  AVAILABILITY_RETENTION_DAYS,
  availabilityRetentionCutoff,
  healthResponse,
} from '../src/api/operations';
import { runScheduledOperations } from '../src/index';
import { routeUrl } from '../src/routing/application-routes';
import type { D1PreparedStatement, Env } from '../src/types';

interface RunRecord {
  sql: string;
  values: unknown[];
}

class AvailabilityStatement implements D1PreparedStatement {
  private values: unknown[] = [];
  constructor(private readonly db: AvailabilityD1, private readonly sql: string) {}
  bind(...values: unknown[]) { this.values = values; return this; }
  async run() {
    this.db.runs.push({ sql: this.sql, values: this.values });
    if (this.sql.includes('INSERT INTO service_health_checks')) this.db.healthWrites += 1;
    return { meta: { last_row_id: 1, changes: this.sql.includes('DELETE FROM service_health_checks') ? 1 : 0 } };
  }
  async all<T>() {
    if (this.sql.includes('FROM demo_control')) {
      return { results: [{ state: 'online', public_message: 'Available.', updated_at: '2026-09-09T12:00:00.000Z', updated_by: 'test' }] as T[] };
    }
    if (this.sql.trim() === 'SELECT 1') return { results: [{ 1: 1 }] as T[] };
    if (this.sql.includes('COUNT(*) AS stored')) return { results: [this.db.aggregate] as T[] };
    if (this.sql.includes('GROUP BY substr')) return { results: this.db.daily as T[] };
    if (this.sql.includes('LIMIT 50')) return { results: this.db.recent as T[] };
    if (this.sql.includes('FROM application_logs')) return { results: [] as T[] };
    return { results: [] as T[] };
  }
}

class AvailabilityD1 {
  healthWrites = 0;
  runs: RunRecord[] = [];
  aggregate = {
    stored: 5,
    verified: 4,
    legacy: 1,
    operational: 2,
    intentional: 1,
    unexpected: 1,
    first_checked_at: '2026-09-09T11:45:00.000Z',
    last_checked_at: '2026-09-09T12:00:00.000Z',
    monitoring_started_at: '2026-09-09T11:40:00.000Z',
  };
  daily = [{ day: '2026-09-09', total: 4, operational: 2, intentional: 1, unexpected: 1 }];
  recent = [
    { id: 4, service_key: 'public-demo', status: 'operational', response_ms: 3, detail_json: '{"intentionalOffline":false,"observationSource":"scheduled","services":{"d1":"operational","r2":"operational","durableObjects":"operational"}}', checked_at: '2026-09-09T12:00:00.000Z' },
    { id: 3, service_key: 'public-demo', status: 'degraded', response_ms: 4, detail_json: '{"intentionalOffline":false,"observationSource":"scheduled","services":{"d1":"operational","r2":"unavailable","durableObjects":"operational"}}', checked_at: '2026-09-09T11:55:00.000Z' },
    { id: 2, service_key: 'public-demo', status: 'down', response_ms: 4, detail_json: '{"intentionalOffline":true,"observationSource":"scheduled","services":{"d1":"operational","r2":"operational","durableObjects":"operational"}}', checked_at: '2026-09-09T11:50:00.000Z' },
    { id: 1, service_key: 'public-demo', status: 'operational', response_ms: 2, detail_json: '{"intentionalOffline":false,"observationSource":"scheduled","services":{"d1":"operational","r2":"operational","durableObjects":"operational"}}', checked_at: '2026-09-09T11:45:00.000Z' },
  ];
  prepare(sql: string) { return new AvailabilityStatement(this, sql); }
}

function env(): Env {
  return {
    DEMO_DB: new AvailabilityD1(),
    GITHUB_REPO_URL: 'https://github.com/SouthernGentlemen/wizardgang-architecture-demo',
    GITHUB_BRANCH: 'main',
  };
}

describe('availability history integrity', () => {
  it('keeps interactive health reads read-only', async () => {
    const environment = env();
    const response = await healthResponse(environment);
    expect(response.status).toBe(200);
    expect((environment.DEMO_DB as AvailabilityD1).healthWrites).toBe(0);
    expect((environment.DEMO_DB as AvailabilityD1).runs.some((run) => run.sql.includes('service_health_checks'))).toBe(false);
  });

  it('stores one deterministic scheduled slot and purges records older than 365 days', async () => {
    const environment = env();
    const scheduledTime = Date.parse('2026-09-09T12:05:00.000Z');
    await runScheduledOperations(environment, scheduledTime);
    const db = environment.DEMO_DB as AvailabilityD1;

    expect(db.healthWrites).toBe(1);
    const slotDelete = db.runs.find((run) => run.sql.includes('service_key = ? AND checked_at = ?'));
    expect(slotDelete?.values).toEqual(['public-demo', '2026-09-09T12:05:00.000Z']);
    const insert = db.runs.find((run) => run.sql.includes('INSERT INTO service_health_checks'));
    expect(insert?.values.at(-1)).toBe('2026-09-09T12:05:00.000Z');
    expect(String(insert?.values[3])).toContain('"observationSource":"scheduled"');
    expect(String(insert?.values[3])).toContain('"scheduledAt":"2026-09-09T12:05:00.000Z"');

    const retentionDelete = db.runs.find((run) => run.sql.includes("service_key = 'public-demo' AND checked_at < ?"));
    expect(retentionDelete?.values).toEqual([availabilityRetentionCutoff(scheduledTime)]);
    expect(availabilityRetentionCutoff(scheduledTime)).toBe('2025-09-09T12:05:00.000Z');
    expect(AVAILABILITY_RETENTION_DAYS).toBe(365);
  });

  it('presents verified coverage separately from retained legacy observations', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:05:00.000Z'));
    try {
      const environment = env();
      const content = await availabilityContent(new Request(`https://demo.wizardgang.ai${routeUrl('operations.availability')}`), environment);
      expect(content.canonicalPath).toBe(routeUrl('operations.availability'));
      expect(content.body).toContain('365 days of measured history');
      expect(content.body).toContain('Only the scheduled five-minute collector writes availability evidence.');
      expect(content.body).toContain('Legacy qualification:');
      expect(content.body).toContain('excluded from availability and coverage calculations');
      expect(content.body).toContain('<strong>66.667%</strong>');
      expect(content.body).toContain('Monitoring coverage');
      expect(content.body).toContain('R2');
      expect(content.body).toContain('annual history stays summarized above');
      expect(content.body).not.toContain('Show full history');
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports bounded review windows without changing the 365-day retention policy', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:05:00.000Z'));
    try {
      const environment = env();
      const content = await availabilityContent(new Request(`https://demo.wizardgang.ai${routeUrl('operations.availability')}?window=24h`), environment);
      expect(content.body).toContain('24 hours of measured history');
      expect(content.body).toContain('retained for 365 days');
      expect(content.body).toContain('window=365d');
    } finally {
      vi.useRealTimers();
    }
  });
});
