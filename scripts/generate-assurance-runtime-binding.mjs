import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASSURANCE_REGISTRY_PATH,
  flattenAssuranceRegistry,
  loadAssuranceRegistry,
} from './lib/assurance-registry.mjs';

export const RUNTIME_BINDING_PATH = 'src/assurance/generated/registry-bindings.ts';

function modulePath(fromFile, targetFile) {
  const fromDirectory = path.dirname(fromFile);
  let relative = path.relative(fromDirectory, targetFile).split(path.sep).join('/');
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
}

export function renderRuntimeBinding(registry) {
  const runtimeResources = flattenAssuranceRegistry(registry)
    .filter((resource) => resource.capabilities?.includes('runtime'))
    .sort((left, right) => left.id.localeCompare(right.id));

  const lines = [
    '// GENERATED FILE: scripts/generate-assurance-runtime-binding.mjs; DO NOT EDIT BY HAND.',
    `import registryData from '${modulePath(RUNTIME_BINDING_PATH, ASSURANCE_REGISTRY_PATH)}';`,
  ];

  runtimeResources.forEach((resource, index) => {
    lines.push(`import dataset${index} from '${modulePath(RUNTIME_BINDING_PATH, resource.path)}';`);
  });

  lines.push('', 'export const assuranceRegistryData = registryData;', '', 'export const assuranceRuntimeDatasets: Record<string, unknown> = {');
  runtimeResources.forEach((resource, index) => {
    lines.push(`  ${JSON.stringify(resource.id)}: dataset${index},`);
  });
  lines.push('};', '');
  return lines.join('\n');
}

function main() {
  const root = process.cwd();
  const checkOnly = process.argv.includes('--check');
  const registry = loadAssuranceRegistry(root);
  const rendered = renderRuntimeBinding(registry);
  const absolute = path.join(root, RUNTIME_BINDING_PATH);

  if (checkOnly) {
    const current = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
    if (current !== rendered) {
      console.error(`${RUNTIME_BINDING_PATH}: generated runtime import binding is stale or does not agree with ${ASSURANCE_REGISTRY_PATH}`);
      process.exit(1);
    }
    console.log(`Assurance runtime import binding agrees with ${ASSURANCE_REGISTRY_PATH}.`);
    return;
  }

  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, rendered);
  console.log(`Generated ${RUNTIME_BINDING_PATH} from ${ASSURANCE_REGISTRY_PATH}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
