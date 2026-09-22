import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { runDiagnosticCommands } from './lib/ci-diagnostics.mjs';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const diagnosticsDir = process.env.CI_DIAGNOSTICS_DIR || '.ci-diagnostics';
const baseSha = process.env.BASE_SHA;
if (baseSha && !/^[0-9a-f]{7,40}$/i.test(baseSha)) throw new Error('BASE_SHA must be a Git commit SHA.');
const localD1PersistenceDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'wizardgang-ci-d1-'));
const localD1Environment = { WG_LOCAL_D1_PERSIST_TO: localD1PersistenceDirectory };

const commands = [
  { label: 'Validate pinned Node/npm toolchain', file: process.execPath, args: ['scripts/validate-toolchain.mjs'] },
  { label: 'Install locked dependencies', file: npm, args: ['ci'] },
  { label: 'Full repository check', file: npm, args: ['run', 'check'], env: localD1Environment },
  { label: 'Verify Chromium runtime', file: npm, args: ['run', 'verify:chromium'] },
  { label: 'Site-wide browser accessibility and localization audit', file: npm, args: ['run', 'test:site-accessibility'], env: localD1Environment },
  { label: 'Audit dependencies', file: npm, args: ['run', 'security:dependencies'] },
  { label: 'Validate Worker build', file: npm, args: ['run', 'build'] },
  { label: 'Validate patch whitespace', file: 'git', args: baseSha ? ['diff', '--check', `${baseSha}...HEAD`] : ['diff', '--check'] },
];

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
