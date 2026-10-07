import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const workflowPath = '.github/workflows/release.yml';
const read = (file) => fs.readFileSync(file, 'utf8');

function inlineNodeBlocks() {
  const lines = read(workflowPath).split('\n');
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)(node\b.*?)\s+-\s+<<'NODE'\s*$/);
    if (!match) continue;
    const indent = match[1];
    const command = match[2];
    const script = [];
    let cursor = index + 1;
    while (cursor < lines.length && lines[cursor] !== `${indent}NODE`) {
      const line = lines[cursor];
      script.push(line.startsWith(indent) ? line.slice(indent.length) : line);
      cursor += 1;
    }
    if (cursor >= lines.length) throw new Error(`${workflowPath} has an unterminated inline Node block at line ${index + 1}.`);
    blocks.push({ line: index + 1, command, script: script.join('\n') });
    index = cursor;
  }
  return blocks;
}

describe('DEMO-307 release identity-baseline module execution', () => {
  it('keeps every repository-owned Release inline Node script explicitly ESM and parseable by Node 26', () => {
    expect(read('.node-version').trim()).toMatch(/^26\./);
    const blocks = inlineNodeBlocks();
    const cutter = spawnSync(process.execPath, ['--check', 'scripts/cut-main-release.ts'], { encoding: 'utf8' });
    expect(cutter.status, cutter.stderr).toBe(0);
    expect(read(workflowPath)).toContain('Exact-tag Release dispatch is not bound to successful current-main CI');
    for (const block of blocks) {
      expect(block.command, `${workflowPath}:${block.line}`).toContain('--input-type=module');
      expect(block.script).not.toMatch(/\brequire\s*\(/);
      const checked = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: block.script, encoding: 'utf8' });
      expect(checked.status, `${workflowPath}:${block.line}: ${checked.stderr}`).toBe(0);
    }
  });

  it('moves deployment implementation out of this repository to the pinned baseline workflow', () => {
    const release = read(workflowPath);
    expect(fs.existsSync('.github/workflows/deploy.yml')).toBe(false);
    expect(release).toContain('Wizard-Gang/baseline/.github/workflows/deploy-worker.yml@5e3847c8cf0072fa9698aa8e5e141f96e00d73bb');
  });
});
