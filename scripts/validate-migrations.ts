import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// The demo ships no DDL. Its local D1 gets baseline's shared schema from the vendored, hash-pinned
// platform/migrations/*.sql (applied in order), the same schema production's `wizardgang` database carries.
const DATABASE_NAME = 'wizardgang';
const SCHEMA_DIRECTORY = path.join('platform', 'migrations');

export function schemaFiles(directory: string = SCHEMA_DIRECTORY): string[] {
  return fs.readdirSync(directory).filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort().map((name) => path.join(directory, name));
}

export function migrationArguments(persistenceDirectory: string, file: string = schemaFiles()[0]): string[] {
  return ['d1', 'execute', DATABASE_NAME, '--local', '--persist-to', persistenceDirectory, '--file', file];
}

export function runCleanLocalMigrations({
  temporaryRoot = os.tmpdir(),
  persistenceDirectory,
  run = spawnSync,
  remove = fs.rmSync,
}: {
  temporaryRoot?: string;
  persistenceDirectory?: string;
  run?: (command: string, args: string[], options: SpawnSyncOptions) => { error?: Error; status: number | null };
  remove?: (target: string, options: { recursive: boolean; force: boolean }) => void;
} = {}): number {
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
    for (const file of schemaFiles()) {
      const result = run(executable, migrationArguments(resolvedPersistenceDirectory, file), {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
      });

      if (result.error) throw result.error;
      if (result.status !== 0) return result.status ?? 1;
    }
    return 0;
  } finally {
    if (ownsPersistenceDirectory) remove(resolvedPersistenceDirectory, { recursive: true, force: true });
  }
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) process.exitCode = runCleanLocalMigrations({ persistenceDirectory: process.env.WG_LOCAL_D1_PERSIST_TO });
