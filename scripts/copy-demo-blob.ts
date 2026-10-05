// DEMO-458 owner-run copy of the demo-blob rows worth keeping into the shared `wizardgang` records table.
//
// Kept: the demo and crawler control records, and one availability record per UTC day of scheduled health
// observations from the last 365 days (the counts the home page sums). Everything else in demo-blob is visitor
// sandbox data, sessions, logs or audit events that expire within days, so it is left behind with the database.
//
//   node scripts/copy-demo-blob.ts export-sql                 # the read-only query to run against demo-blob
//   node scripts/copy-demo-blob.ts import-sql < export.json   # wrangler --json output in, INSERT statements out
//
// The INSERTs are idempotent. Control records never overwrite a record the new Worker already wrote, and an
// availability day is replaced only while it holds nothing but imported counts.
import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const APP = 'demo';
const DAY_MS = 86_400_000;
const RETENTION_DAYS = 365;

export const EXPORT_SQL = [
  "SELECT 'control' AS collection, 'demo' AS id, json_object('state', state, 'publicMessage', public_message, 'updatedAt', updated_at, 'updatedBy', updated_by) AS body FROM demo_control WHERE id = 1",
  "UNION ALL SELECT 'control', 'crawler', json_object('state', state, 'updatedAt', updated_at, 'updatedBy', updated_by) FROM crawler_control WHERE id = 1",
  "UNION ALL SELECT 'availability', day, json_object('verified', count(*), 'operational', sum(status = 'operational'), 'intentional', sum(intentional))",
  "FROM (SELECT substr(checked_at, 1, 10) AS day, status, COALESCE(detail_json, '') LIKE '%\"intentionalOffline\":true%' AS intentional",
  "FROM service_health_checks WHERE service_key = 'public-demo' AND COALESCE(detail_json, '') LIKE '%\"observationSource\":\"scheduled\"%'",
  `AND checked_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-${RETENTION_DAYS} days')) GROUP BY day`,
].join(' ');

interface ExportRow {
  collection: string;
  id: string;
  body: string;
}

interface Counts {
  verified: number;
  operational: number;
  intentional: number;
}

function fail(message: string): never {
  throw new Error(`copy-demo-blob: ${message}`);
}

function quoted(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/** The rows of a `wrangler d1 execute --json` result: an array with one `{ results }` entry per statement. */
export function exportRows(output: unknown): ExportRow[] {
  if (!Array.isArray(output) || output.length !== 1 || !Array.isArray(output[0]?.results)) fail('expected wrangler --json output of the single export query');
  return (output[0].results as unknown[]).map((row) => {
    const { collection, id, body } = (row ?? {}) as Record<string, unknown>;
    if (typeof collection !== 'string' || typeof id !== 'string' || typeof body !== 'string') fail('every row needs string collection, id and body');
    return { collection, id, body };
  });
}

function counts(body: string, day: string): Counts {
  const parsed = JSON.parse(body) as Record<string, unknown>;
  const values = [parsed.verified, parsed.operational, parsed.intentional];
  if (!values.every((value) => Number.isInteger(value) && (value as number) >= 0)) fail(`availability ${day} needs non-negative integer counts`);
  const [verified, operational, intentional] = values as number[];
  if (operational > verified || intentional > verified) fail(`availability ${day} counts exceed verified`);
  return { verified, operational, intentional };
}

function controlStatement(row: ExportRow, now: number): string {
  const body = JSON.parse(row.body) as Record<string, unknown>;
  const allowed = row.id === 'demo' ? ['online', 'offline'] : ['enabled', 'disabled'];
  if (!allowed.includes(String(body.state))) fail(`control ${row.id} has an unexpected state`);
  return 'INSERT INTO records (app, collection, id, body, owner, created_at, updated_at, expires_at) '
    + `VALUES (${quoted(APP)}, 'control', ${quoted(row.id)}, ${quoted(JSON.stringify(body))}, NULL, ${now}, ${now}, NULL) `
    + 'ON CONFLICT (app, collection, id) DO NOTHING;';
}

function availabilityStatement(row: ExportRow, now: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.id) || Number.isNaN(Date.parse(row.id))) fail(`availability id ${row.id} is not a UTC day`);
  const imported = counts(row.body, row.id);
  const body = JSON.stringify({ ...imported, imported });
  // The same 365-day TTL the Worker gives a day, counted from the end of that day.
  const expiresAt = Date.parse(`${row.id}T00:00:00.000Z`) + (RETENTION_DAYS + 1) * DAY_MS;
  return 'INSERT INTO records (app, collection, id, body, owner, created_at, updated_at, expires_at) '
    + `VALUES (${quoted(APP)}, 'availability', ${quoted(row.id)}, ${quoted(body)}, NULL, ${now}, ${now}, ${expiresAt}) `
    + 'ON CONFLICT (app, collection, id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at, expires_at = excluded.expires_at '
    + "WHERE json_extract(records.body, '$.verified') = json_extract(records.body, '$.imported.verified');";
}

export function importSql(rows: ExportRow[], now = Date.now()): string {
  const statements = rows.map((row) => {
    if (row.collection === 'control' && (row.id === 'demo' || row.id === 'crawler')) return controlStatement(row, now);
    if (row.collection === 'availability') return availabilityStatement(row, now);
    return fail(`unexpected row ${row.collection}/${row.id}`);
  });
  const controls = rows.filter((row) => row.collection === 'control').length;
  return [`-- DEMO-458: ${controls} control and ${rows.length - controls} availability records for app ${APP}.`, ...statements, ''].join('\n');
}

const invokedDirectly = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const command = process.argv[2];
  if (command === 'export-sql') process.stdout.write(`${EXPORT_SQL}\n`);
  else if (command === 'import-sql') process.stdout.write(importSql(exportRows(JSON.parse(fs.readFileSync(0, 'utf8')))));
  else {
    process.stderr.write('usage: node scripts/copy-demo-blob.ts export-sql | import-sql < export.json\n');
    process.exitCode = 2;
  }
}
