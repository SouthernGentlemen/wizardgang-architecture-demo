import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const workflowPaths = [
  '.github/workflows/release.yml',
  '.github/workflows/deploy.yml',
];

const read = (file) => fs.readFileSync(file, 'utf8');

function inlineNodeBlocks(workflowPath) {
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

    if (cursor >= lines.length) {
      throw new Error(`${workflowPath} has an unterminated inline Node block at line ${index + 1}.`);
    }

    blocks.push({
      workflowPath,
      line: index + 1,
      command,
      script: script.join('\n'),
    });
    index = cursor;
  }

  return blocks;
}

describe('DEMO-307 release identity-baseline module execution', () => {
  it('keeps every release/deploy inline Node script explicitly ESM and parseable by the pinned Node 22 toolchain', () => {
    const pinnedVersion = read('.node-version').trim();
    expect(pinnedVersion).toMatch(/^22\./);

    const blocks = workflowPaths.flatMap(inlineNodeBlocks);
    expect(blocks.length).toBeGreaterThan(0);

    for (const block of blocks) {
      expect(block.command, `${block.workflowPath}:${block.line}`).toContain('--input-type=module');
      expect(block.script, `${block.workflowPath}:${block.line}`).not.toMatch(/\brequire\s*\(/);

      const checked = spawnSync(process.execPath, ['--input-type=module', '--check'], {
        input: block.script,
        encoding: 'utf8',
      });

      expect(
        checked.status,
        `${block.workflowPath}:${block.line} failed Node module syntax validation:\n${checked.stderr}`,
      ).toBe(0);
      expect(checked.stderr).not.toContain('ERR_AMBIGUOUS_MODULE_SYNTAX');
    }
  });
});
