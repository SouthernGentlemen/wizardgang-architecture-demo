import { execFileSync } from 'node:child_process';
import { prepareBrowserInputs, verifyBrowserInputs } from './lib/prepared-browser-inputs.ts';
const operation = process.argv[2];
if (!['prepare', 'verify'].includes(operation)) throw new Error('Expected prepare or verify.');
const context = {
  sha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  runId: process.env.GITHUB_RUN_ID,
};
(operation === 'prepare' ? prepareBrowserInputs : verifyBrowserInputs)(process.cwd(), context);
console.log(`Prepared browser inputs ${operation} succeeded for run ${context.runId}, head ${context.sha}.`);
