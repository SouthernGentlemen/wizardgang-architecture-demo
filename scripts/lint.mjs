import fs from 'node:fs';
import path from 'node:path';

const failures = [];
const extensions = new Set(['.ts', '.mjs', '.json', '.jsonc', '.md', '.yml', '.yaml', '.graphql', '.sql', '.xml']);

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.wrangler', 'dist', 'coverage'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) {
      const text = fs.readFileSync(full, 'utf8');
      text.split(/\r?\n/).forEach((line, index) => {
        if (path.extname(entry.name) !== '.md' && /[ \t]+$/.test(line)) failures.push(`${full}:${index + 1} trailing whitespace`);
        if (line.includes('\t')) failures.push(`${full}:${index + 1} tab character`);
      });
    }
  }
}
walk('.');
if (failures.length) {
  console.error('Lint failed:');
  failures.slice(0, 100).forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Lightweight repository lint passed.');
