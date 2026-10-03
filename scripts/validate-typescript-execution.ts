import process from 'node:process';
import { assuranceRelationshipNames } from '../src/assurance/relationship-contract.ts';

type ProbeMode = '--self-check' | '--echo' | '--exit' | '--throw';

const [rawMode = '--self-check', value = ''] = process.argv.slice(2);
const mode = rawMode as ProbeMode;
const relationshipNames = assuranceRelationshipNames();

if (relationshipNames.length === 0) {
  throw new Error('Native TypeScript execution could not import the assurance relationship authority.');
}

switch (mode) {
  case '--self-check':
    console.log(`Native TypeScript execution OK via ESM import: ${relationshipNames[0]}.`);
    break;
  case '--echo':
    console.log(value);
    break;
  case '--exit': {
    const exitCode = Number(value);
    if (!Number.isInteger(exitCode) || exitCode < 1 || exitCode > 255) {
      throw new Error(`Exit code must be an integer from 1 through 255; got "${value}".`);
    }
    process.exitCode = exitCode;
    break;
  }
  case '--throw':
    throw new Error(value || 'TypeScript stack trace probe');
  default:
    console.error(`Unknown TypeScript execution probe mode: ${rawMode}`);
    process.exitCode = 64;
}
