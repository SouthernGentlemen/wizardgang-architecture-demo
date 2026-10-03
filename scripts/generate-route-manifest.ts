import { spawnSync } from 'node:child_process';

const command = process.argv.includes('--check') ? 'validate:routes' : 'generate:routes';
const result = spawnSync('npm', ['run', command], { stdio: 'inherit', shell: process.platform === 'win32' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
