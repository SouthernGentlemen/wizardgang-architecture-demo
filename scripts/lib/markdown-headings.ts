import path from 'node:path';

export function plainHeadingText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[`*_~]/g, '')
    .trim();
}

export function githubSlug(value: string): string {
  return plainHeadingText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function headingAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>();
  const counts = new Map<string, number>();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const base = githubSlug(match[2]);
    if (!base) continue;
    const duplicate = counts.get(base) ?? 0;
    counts.set(base, duplicate + 1);
    anchors.add(duplicate === 0 ? base : base + '-' + duplicate);
  }
  return anchors;
}

export function normalizeRepositoryPath(source: string, target: string): { repositoryPath: string; anchor: string } {
  const withoutAngle = target.replace(/^<|>$/g, '');
  const [rawPath, rawAnchor = ''] = withoutAngle.split('#', 2);
  let decodedPath = rawPath;
  let decodedAnchor = rawAnchor;
  try { decodedPath = decodeURIComponent(rawPath); } catch {}
  try { decodedAnchor = decodeURIComponent(rawAnchor); } catch {}
  const resolved = decodedPath
    ? path.posix.normalize(path.posix.join(path.posix.dirname(source), decodedPath))
    : source;
  return { repositoryPath: resolved.replace(/^\.\//, ''), anchor: decodedAnchor };
}
