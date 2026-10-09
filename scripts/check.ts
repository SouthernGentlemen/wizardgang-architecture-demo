import { acceptanceCommands } from './lib/acceptance-plan.ts';
import { runDiagnosticCommands } from './lib/ci-diagnostics.ts';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const group = process.argv[2] || 'all';
const owned = process.env.WG_LOCAL_D1_PERSIST_TO ? null : fs.mkdtempSync(path.join(os.tmpdir(), 'wg-check-d1-'));
try {
  const report = await runDiagnosticCommands({
    commands: acceptanceCommands({ group, checkEnvironment: { WG_LOCAL_D1_PERSIST_TO: process.env.WG_LOCAL_D1_PERSIST_TO || owned } }),
    diagnosticsDir: process.env.CI_DIAGNOSTICS_DIR || '.ci-diagnostics',
  });
  process.exitCode = report.failure?.exitCode || 0;
} finally {
  if (owned) fs.rmSync(owned, { recursive: true, force: true });
}
