import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const MAX_BLOB_BYTES = 2 * 1024 * 1024;
const MAX_HISTORY_BYTES = 128 * 1024 * 1024;

const forbiddenPath = /(^|\/)(?:\.dev\.vars|\.env(?:\.[^/]*)?|id_(?:rsa|ed25519|ecdsa)|[^/]+\.(?:pem|key|p12|pfx))$/i;
const secretPatterns = [
  ['private key material', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['OpenAI-style secret', /\bsk-[A-Za-z0-9_-]{24,}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ['credential-bearing URL', /https?:\/\/[^\s/:]+:[^\s/@]+@|[?&](?:token|api[_-]?key|password|secret)=[^\s&#]+/i],
];
const assignedCredential = /\b(api[_-]?key|access[_-]?token|auth[_-]?token|password|client[_-]?secret)\b\s*[:=]\s*(["'])([^"'\n]{8,})\2/gi;

// Exact hashes of four public synthetic values in historical test fixtures.
// The exception requires both the original test path and the exact value hash.
const safeFixtureHashes = {
  'tests/demo-329-react-operational-pages.test.ts': {
    password: ['68378387bee9df88e22372fa0fd160952f57644a1adff23d9e427991250aa251'],
  },
  'tests/identity.test.ts': {
    access_token: [
      'e9e1de39f63ad58c42f5aacd0b493d01213ac7345d9736725554a422104109eb',
      'e1fcd0288cb25c64166256865498b12600fd1776805ebee0f2b530d069d7cf49',
    ],
  },
  'tests/logs.test.ts': {
    password: ['a46a6ec442dfd1ff3bc8acf777a61215ecf5045fb2053163b8e490a4e6d2ddd3'],
  },
};

export function secretKinds(text, paths = []) {
  const kinds = secretPatterns.filter(([, pattern]) => pattern.test(text)).map(([kind]) => kind);
  for (const match of text.matchAll(assignedCredential)) {
    const key = match[1].toLowerCase();
    const hash = createHash('sha256').update(match[3]).digest('hex');
    const isSafe = paths.length > 0 && paths.every((path) => safeFixtureHashes[path]?.[key]?.includes(hash));
    if (!isSafe) {
      kinds.push('assigned credential');
      break;
    }
  }
  return kinds;
}

export function isForbiddenSecretPath(path) {
  return forbiddenPath.test(path);
}

function git(cwd, args, options = {}) {
  return execFileSync('git', args, {
    cwd,
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
}

export function scanPublicHistory(cwd) {
  const revisions = git(cwd, ['rev-list', '--all'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const blobs = new Map();
  const findings = new Set();

  for (const revision of revisions) {
    const entries = git(cwd, ['ls-tree', '-r', '-l', '-z', revision]).toString('utf8').split('\0');
    for (const entry of entries) {
      if (!entry) continue;
      const match = /^\d+ blob ([0-9a-f]{40,64})\s+(\d+)\t([\s\S]*)$/.exec(entry);
      if (!match) continue;
      const [, object, sizeText, path] = match;
      if (isForbiddenSecretPath(path)) findings.add(`${revision.slice(0, 12)}: forbidden secret-file path`);
      if (!blobs.has(object)) blobs.set(object, { size: Number(sizeText), paths: new Set() });
      blobs.get(object).paths.add(path);
    }
  }

  let totalBytes = 0;
  const readable = [];
  for (const [object, { size }] of blobs) {
    if (size > MAX_BLOB_BYTES) {
      findings.add(`${object.slice(0, 12)}: blob exceeds the bounded secret-scan size`);
      continue;
    }
    totalBytes += size;
    readable.push(object);
  }
  if (totalBytes > MAX_HISTORY_BYTES) {
    findings.add(`reachable blob content exceeds the ${MAX_HISTORY_BYTES / 1024 / 1024} MiB scan budget`);
    return { revisions: revisions.length, blobs: blobs.size, findings: [...findings] };
  }

  if (readable.length) {
    const output = git(cwd, ['cat-file', '--batch'], {
      input: `${readable.join('\n')}\n`,
      maxBuffer: MAX_HISTORY_BYTES + readable.length * 128,
    });
    let offset = 0;
    for (const object of readable) {
      const end = output.indexOf(10, offset);
      if (end < 0) throw new Error('Git blob batch ended before its object header');
      const header = output.toString('ascii', offset, end);
      const match = /^([0-9a-f]{40,64}) blob (\d+)$/.exec(header);
      if (!match || match[1] !== object || Number(match[2]) !== blobs.get(object).size) {
        throw new Error('Git blob batch did not match the reachable tree inventory');
      }
      const size = Number(match[2]);
      const content = output.subarray(end + 1, end + 1 + size);
      if (content.length !== size || output[end + 1 + size] !== 10) {
        throw new Error('Git blob batch contains a truncated object');
      }
      if (!content.includes(0)) {
        for (const kind of secretKinds(content.toString('utf8'), [...blobs.get(object).paths])) {
          findings.add(`${object.slice(0, 12)}: possible ${kind}`);
        }
      }
      offset = end + size + 2;
    }
    if (offset !== output.length) throw new Error('Git blob batch contains unexpected trailing data');
  }

  return { revisions: revisions.length, blobs: blobs.size, findings: [...findings] };
}
