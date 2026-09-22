import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DATABASE_NAME = 'demo-blob';

export function migrationArguments(persistenceDirectory) {
  return ['d1', 'migrations', 'apply', DATABASE_NAME, '--local', '--persist-to', persistenceDirectory];
}

export function runCleanLocalMigrations({
  temporaryRoot = os.tmpdir(),
  persistenceDirectory,
  run = spawnSync,
  remove = fs.rmSync,
} = {}) {
  const ownsPersistenceDirectory = !persistenceDirectory;
  const resolvedPersistenceDirectory = persistenceDirectory
    ? path.resolve(persistenceDirectory)
    : fs.mkdtempSync(path.join(temporaryRoot, 'wizardgang-d1-migrations-'));

  if (!ownsPersistenceDirectory) {
    fs.mkdirSync(resolvedPersistenceDirectory, { recursive: true });
    if (fs.readdirSync(resolvedPersistenceDirectory).length) {
      throw new Error('Shared local D1 persistence must be empty before migration validation.');
    }
  }

  try {
    const executable = process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler';
    const result = run(executable, migrationArguments(resolvedPersistenceDirectory), {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });

    if (result.error) throw result.error;
    return result.status ?? 1;
  } finally {
    if (ownsPersistenceDirectory) remove(resolvedPersistenceDirectory, { recursive: true, force: true });
  }
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) process.exitCode = runCleanLocalMigrations({ persistenceDirectory: process.env.WG_LOCAL_D1_PERSIST_TO });
