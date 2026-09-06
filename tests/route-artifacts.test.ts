import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applicationRouteRegistry, type ApplicationRouteDeclaration } from '../src/routing/application-routes';
import { buildRoutesDocumentation, serializeRouteManifest } from '../src/routing/artifacts';

const root = process.cwd();
const manifestPath = path.join(root, 'docs', 'route-manifest.json');
const routesPath = path.join(root, 'docs', 'ROUTES.md');
const declarations = applicationRouteRegistry.declarations as readonly ApplicationRouteDeclaration[];
const expectedManifest = serializeRouteManifest(declarations);
const expectedRoutes = buildRoutesDocumentation(declarations);
const write = process.env.ROUTE_ARTIFACTS_WRITE === '1';

function reconcile(filePath: string, expected: string, label: string): string {
  if (write) fs.writeFileSync(filePath, expected);
  const current = fs.readFileSync(filePath, 'utf8');
  if (current !== expected) {
    const relativePath = path.relative(root, filePath);
    const currentLines = current.split('\n');
    const expectedLines = expected.split('\n');
    const firstDifferentIndex = currentLines.findIndex((line, index) => line !== expectedLines[index]);
    const firstDifferentLine =
      firstDifferentIndex === -1 ? Math.min(currentLines.length, expectedLines.length) + 1 : firstDifferentIndex + 1;
    const message = `Generated ${label.toLowerCase()} artifact is stale at ${relativePath}:${firstDifferentLine}. Run npm run generate:routes and commit the result.`;

    console.error(`::error file=${relativePath},line=${firstDifferentLine}::${message}`);
    throw new Error(message);
  }
  return current;
}

describe('registry-generated route artifacts', () => {
  it('keeps the route manifest identical to active declarations', () => {
    expect(reconcile(manifestPath, expectedManifest, 'MANIFEST')).toBe(expectedManifest);
  });

  it('keeps route documentation tables identical to active declarations', () => {
    expect(reconcile(routesPath, expectedRoutes, 'ROUTES')).toBe(expectedRoutes);
  });
});
