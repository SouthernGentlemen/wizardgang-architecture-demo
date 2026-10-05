import { describe, expect, it } from 'vitest';
import { EXPORT_SQL, exportRows, importSql } from '../scripts/copy-demo-blob.ts';
import { availabilityDays, collectHealth } from '../src/api/operations';
import { getCrawlerControl } from '../src/lib/crawler-control';
import { getDemoControl } from '../src/lib/demo-control';
import type { Env } from '../src/types';
import { SqliteD1 } from './helpers/wg-storage';

const exported = [{
  results: [
    { collection: 'control', id: 'demo', body: JSON.stringify({ state: 'online', publicMessage: 'The architecture demo is available.', updatedAt: '2026-08-31T18:46:17.701Z', updatedBy: 'operator' }) },
    { collection: 'control', id: 'crawler', body: JSON.stringify({ state: 'enabled', updatedAt: '2026-09-01T20:27:07.107Z', updatedBy: 'admin' }) },
    { collection: 'availability', id: '2026-09-09', body: JSON.stringify({ verified: 71, operational: 70, intentional: 1 }) },
    { collection: 'availability', id: '2026-09-10', body: JSON.stringify({ verified: 287, operational: 287, intentional: 0 }) },
  ],
  success: true,
}];

function env(db: SqliteD1): Env {
  return { WG_DB: db, GITHUB_REPO_URL: 'https://github.com/Wizard-Gang/wizardgang-architecture-demo', GITHUB_BRANCH: 'main' };
}

describe('DEMO-458 owner-run demo-blob copy', () => {
  it('exports only the control rows and the scheduled availability counts of the last 365 days', () => {
    expect(EXPORT_SQL).toContain('FROM demo_control');
    expect(EXPORT_SQL).toContain('FROM crawler_control');
    expect(EXPORT_SQL).toContain("'now', '-365 days'");
    expect(EXPORT_SQL).toContain('"observationSource":"scheduled"');
    expect(EXPORT_SQL).not.toMatch(/\b(INSERT|UPDATE|DELETE|DROP|CREATE)\b/);
  });

  it('writes records the Worker reads back, and re-running changes nothing', async () => {
    const db = new SqliteD1();
    const sql = importSql(exportRows(exported), Date.parse('2026-10-05T20:00:00.000Z'));
    db.db.exec(sql);
    db.db.exec(sql);
    expect(await getCrawlerControl(env(db))).toMatchObject({ state: 'enabled', updatedBy: 'admin' });
    expect(await getDemoControl(env(db))).toMatchObject({ state: 'online', updatedBy: 'operator' });
    const days = db.records<{ verified: number; imported: { verified: number } }>('availability');
    expect([...days.keys()]).toEqual(['2026-09-09', '2026-09-10']);
    expect(days.get('2026-09-09')?.body).toEqual({ verified: 71, operational: 70, intentional: 1, imported: { verified: 71, operational: 70, intentional: 1 } });
    expect(days.get('2026-09-09')?.expiresAt).toBe(Date.parse('2026-09-09T00:00:00.000Z') + 366 * 86_400_000);
    expect((await availabilityDays(env(db))).reduce((sum, day) => sum + day.verified, 0)).toBe(358);
  });

  it('never overwrites a control record or an availability day the new Worker already wrote', async () => {
    const db = new SqliteD1();
    db.putRecord('control', 'crawler', { state: 'disabled', updatedAt: '2026-10-06T00:00:00.000Z', updatedBy: 'admin' });
    db.putRecord('availability', '2026-09-10', { verified: 290, operational: 290, intentional: 0, imported: { verified: 287, operational: 287, intentional: 0 } });
    db.db.exec(importSql(exportRows(exported)));
    expect((await getCrawlerControl(env(db))).state).toBe('disabled');
    expect(db.records('availability').get('2026-09-10')?.body).toMatchObject({ verified: 290 });
    expect((await collectHealth(env(db))).demo.state).toBe('online');
  });

  it('refuses unexpected rows and malformed counts', () => {
    expect(() => importSql([{ collection: 'demo_records', id: 'x', body: '{}' }])).toThrow(/unexpected row/);
    expect(() => importSql([{ collection: 'availability', id: '2026-09-10', body: JSON.stringify({ verified: 1, operational: 2, intentional: 0 }) }])).toThrow(/exceed/);
    expect(() => importSql([{ collection: 'control', id: 'crawler', body: JSON.stringify({ state: 'maybe' }) }])).toThrow(/unexpected state/);
    expect(() => exportRows({ results: [] })).toThrow(/wrangler --json/);
  });
});
