import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const failures = [];
const secretPatterns = [
  { name: 'private key material', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'OpenAI-style secret', pattern: /\bsk-[A-Za-z0-9_-]{24,}\b/ },
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: 'committed dev secrets file', path: /^\.dev\.vars$/ },
  { name: 'committed environment secrets file', path: /^\.env(?:\.|$)/ },
];

for (const file of tracked) {
  if (secretPatterns.some((candidate) => candidate.path?.test(file))) failures.push(`${file}: ${secretPatterns.find((candidate) => candidate.path?.test(file)).name}`);
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  for (const candidate of secretPatterns) if (candidate.pattern?.test(text)) failures.push(`${file}: possible ${candidate.name}`);
}

if (failures.length) {
  console.error('Security validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`Security validation passed: ${tracked.length} tracked files checked for high-confidence secret material.`);
