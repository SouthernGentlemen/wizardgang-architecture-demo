import fs from 'node:fs';
import process from 'node:process';
import { releaseDispatchFromEnvironment, validateExactTagDispatch } from './lib/exact-tag-release.ts';
import { packageVersion } from './lib/git-demo-workflow.ts';

const [operation] = process.argv.slice(2);
switch (operation) {
  case 'validate-dispatch':
    validateExactTagDispatch(releaseDispatchFromEnvironment(process.env));
    break;
  case 'package-version':
    console.log(packageVersion(fs.readFileSync(0, 'utf8')));
    break;
  default:
    console.error(`Unknown Release workflow operation: ${operation ?? '(none)'}`);
    process.exitCode = 64;
}
