import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createCiValidationCommands } from './lib/acceptance-plan.mjs';
import { runDiagnosticCommands } from './lib/ci-diagnostics.mjs';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const diagnosticsDir = process.env.CI_DIAGNOSTICS_DIR || '.ci-diagnostics';
const localD1PersistenceDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'wizardgang-ci-d1-'));
const localD1Environment = { WG_LOCAL_D1_PERSIST_TO: localD1PersistenceDirectory };

const commands = createCiValidationCommands({
  nodeExecutable: process.execPath,
  npmExecutable: npm,
  checkEnvironment: localD1Environment,
});

let report;
try {
  report = await runDiagnosticCommands({
    commands,
    cwd: process.cwd(),
    diagnosticsDir: path.normalize(diagnosticsDir),
    environment: process.env,
  });
} finally {
  fs.rmSync(localD1PersistenceDirectory, { recursive: true, force: true });
}
process.exitCode = report.failure?.exitCode || 0;
