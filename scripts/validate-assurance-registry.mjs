import fs from 'node:fs';
import path from 'node:path';
import {
  ASSURANCE_REGISTRY_PATH,
  assuranceRecordResources,
  assuranceRecordsFromDocument,
  canonicalAssuranceDatasetPaths,
  discoverCanonicalAssuranceJson,
  flattenAssuranceRegistry,
  isControlledRelativePath,
  loadAssuranceRegistry,
  readJsonFile,
  requireAssuranceCapabilityResource,
} from './lib/assurance-registry.mjs';
import {
  validateAssuranceSchemaValue,
  validateRegisteredAssuranceResource,
} from './lib/assurance-validation.mjs';
import { validateAssuranceRouteContract } from '../src/assurance/route-contract.js';
import { renderRuntimeBinding, RUNTIME_BINDING_PATH } from './generate-assurance-runtime-binding.mjs';

const root = process.cwd();
const errors = [];
const registrySchemaPath = 'contracts/assurance/registry.schema.json';
const stableV1Kinds = new Set(['evidence', 'claims', 'compliance', 'risks', 'incidents', 'exercises', 'advisories']);
const reportingDomains = new Set(['evidence', 'reports', 'issues', 'risks', 'security', 'governance', 'operations']);
const cloudflareObservationIdentity = ['resource', 'metric', 'dimensions', 'window.start', 'window.end'];

function fail(message) {
  errors.push(message);
}

function exists(relative) {
  return isControlledRelativePath(relative) && fs.existsSync(path.join(root, relative));
}

function sourceBindingKey(source) {
  return [source.provider, source.scope?.repository ?? '', source.scope?.resource ?? ''].join('|');
}

function schemaFile(reference) {
  return typeof reference === 'string' ? reference.split('#', 1)[0] : '';
}

let registry;
try {
  registry = loadAssuranceRegistry(root);
} catch (error) {
  fail(`${ASSURANCE_REGISTRY_PATH}: unable to read registry: ${error instanceof Error ? error.message : String(error)}`);
}

if (registry) {
  errors.push(...validateAssuranceSchemaValue(root, ASSURANCE_REGISTRY_PATH, registrySchemaPath, registry));
  for (const error of validateAssuranceRouteContract(registry)) fail(`${ASSURANCE_REGISTRY_PATH}: ${error}`);

  const resources = flattenAssuranceRegistry(registry);
  const identities = new Map();
  const registeredPaths = new Map();

  for (const resource of resources) {
    if (identities.has(resource.id)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate dataset identity ${resource.id}`);
    else identities.set(resource.id, resource.path);

    if (registeredPaths.has(resource.path)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate registered path ${resource.path}`);
    else registeredPaths.set(resource.path, resource.id);

    const hasRecords = resource.capabilities?.includes('records');
    const hasRuntime = resource.capabilities?.includes('runtime');
    const hasApiIndex = resource.capabilities?.includes('api-index');
    if (hasRecords && !hasRuntime) fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} records capability requires runtime capability for shared Worker/Node record discovery`);
    if (hasRecords && !resource.recordCollection) fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} records capability requires recordCollection metadata`);
    if (!hasRecords && resource.recordCollection) fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} declares recordCollection without records capability`);
    if (hasApiIndex && (!hasRuntime || !hasRecords)) {
      fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} api-index capability requires runtime and records capabilities`);
    }

    if (!exists(resource.path)) fail(`${ASSURANCE_REGISTRY_PATH}: registered dataset is missing: ${resource.path}`);
    if (!exists(resource.schema)) fail(`${ASSURANCE_REGISTRY_PATH}: registered schema is missing for ${resource.path}: ${resource.schema}`);
    if (!exists(resource.path) || !exists(resource.schema)) continue;

    let data;
    try {
      data = readJsonFile(root, resource.path);
    } catch (error) {
      fail(`${resource.path}: unable to read registered data: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    errors.push(...validateRegisteredAssuranceResource(root, resource, data));
    if (hasRecords) {
      try {
        assuranceRecordsFromDocument(resource, data);
      } catch (error) {
        fail(`${resource.path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  const reporting = registry.reporting;
  if (!reporting) {
    fail(`${ASSURANCE_REGISTRY_PATH}: common reporting contract declaration is required`);
  } else {
    if (!exists(reporting.contract)) fail(`${ASSURANCE_REGISTRY_PATH}: reporting contract is missing: ${reporting.contract}`);

    const declaredSources = [
      ...(reporting.retainedReports ? [reporting.retainedReports] : []),
      ...(reporting.nativeObjects ?? []),
      ...(reporting.observations ?? []),
      ...(reporting.privateSources ?? []),
    ];
    const sourceIds = new Map();
    const sourceBindings = new Map();
    const structured = reporting.structuredRecords;
    const retained = reporting.retainedReports;

    if (structured) {
      sourceIds.set(structured.id, 'structured records');
      if (structured.provider !== 'github' || structured.authority !== 'structured-record') {
        fail(`${ASSURANCE_REGISTRY_PATH}: structured reporting records must be GitHub structured-record authority`);
      }
      for (const capability of ['read', 'query', 'export', 'import']) {
        if (!structured.capabilities?.includes(capability)) fail(`${ASSURANCE_REGISTRY_PATH}: structured reporting source requires ${capability} capability`);
      }
      if (structured.capabilities?.includes('observe')) fail(`${ASSURANCE_REGISTRY_PATH}: structured reporting source must not declare observe capability`);
      if (structured.ingestion !== 'enabled') fail(`${ASSURANCE_REGISTRY_PATH}: public GitHub structured reporting ingestion must be enabled`);
      for (const resource of resources) {
        if (!resource.path.startsWith(structured.resourceRoot ?? '')) {
          fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} is outside the structured reporting resource root ${structured.resourceRoot}`);
          continue;
        }
        const binding = ['github', structured.repository, resource.path].join('|');
        if (sourceBindings.has(binding)) {
          fail(`${ASSURANCE_REGISTRY_PATH}: authoritative structured source binding ${binding} is shared by ${sourceBindings.get(binding)} and ${resource.id}`);
        } else {
          sourceBindings.set(binding, resource.id);
        }
        if (!exists(resource.schema)) fail(`${ASSURANCE_REGISTRY_PATH}: reporting source ${resource.id} has no schema coverage at ${resource.schema}`);
        if (resource.visibility === 'private' && reporting.privateIngestion !== 'disabled') {
          fail(`${ASSURANCE_REGISTRY_PATH}: private structured resource ${resource.id} requires disabled private ingestion`);
        }
      }
    }

    if (retained && structured && retained.scope?.repository !== structured.repository) {
      fail(`${ASSURANCE_REGISTRY_PATH}: retained reports must use the structured-record repository ${structured.repository}`);
    }

    for (const source of declaredSources) {
      if (sourceIds.has(source.id)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate authoritative reporting source identity ${source.id}`);
      else sourceIds.set(source.id, sourceBindingKey(source));

      const binding = sourceBindingKey(source);
      if (sourceBindings.has(binding)) {
        fail(`${ASSURANCE_REGISTRY_PATH}: duplicate authoritative reporting source binding ${binding}`);
      } else {
        sourceBindings.set(binding, source.id);
      }

      const sourceSchema = schemaFile(source.schema);
      if (!sourceSchema || !exists(sourceSchema)) fail(`${ASSURANCE_REGISTRY_PATH}: reporting source ${source.id} has missing schema ${source.schema}`);
      if (source.visibility === 'private' && source.ingestion !== 'disabled') fail(`${ASSURANCE_REGISTRY_PATH}: private reporting source ${source.id} must keep ingestion disabled`);
      if (source.visibility === 'private' && source.capabilities?.includes('import')) fail(`${ASSURANCE_REGISTRY_PATH}: private reporting source ${source.id} must not expose import capability before protected consumption exists`);
      if (source.authority === 'native-object' && source.capabilities?.includes('observe')) fail(`${ASSURANCE_REGISTRY_PATH}: native GitHub object ${source.id} must not declare observe capability`);
      if (source.authority === 'native-observation') {
        if (!source.capabilities?.includes('observe')) fail(`${ASSURANCE_REGISTRY_PATH}: observation source ${source.id} requires observe capability`);
        if (source.capabilities?.includes('import')) fail(`${ASSURANCE_REGISTRY_PATH}: observation source ${source.id} must not declare import capability`);
        if (JSON.stringify(source.observationIdentity) !== JSON.stringify(cloudflareObservationIdentity)) {
          fail(`${ASSURANCE_REGISTRY_PATH}: aggregate observation source ${source.id} identity must be resource + metric + dimensions + observation window`);
        }
      }
    }

    if (reporting.privateIngestion !== 'disabled') fail(`${ASSURANCE_REGISTRY_PATH}: private reporting ingestion must remain disabled until protected consumption is implemented`);

    const seenDomains = new Set();
    for (const ownership of reporting.ownership ?? []) {
      if (seenDomains.has(ownership.domain)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate reporting ownership for ${ownership.domain}`);
      else seenDomains.add(ownership.domain);
      if (!reportingDomains.has(ownership.domain)) fail(`${ASSURANCE_REGISTRY_PATH}: unsupported reporting ownership domain ${ownership.domain}`);
      if (!sourceIds.has(ownership.source)) fail(`${ASSURANCE_REGISTRY_PATH}: ${ownership.domain} references unknown reporting source ${ownership.source}`);
      if (ownership.source === structured?.id) {
        if (!ownership.resource || !identities.has(ownership.resource)) {
          fail(`${ASSURANCE_REGISTRY_PATH}: ${ownership.domain} structured ownership must identify one registered resource`);
        }
      } else if (ownership.resource) {
        fail(`${ASSURANCE_REGISTRY_PATH}: ${ownership.domain} native-source ownership must not shadow provider scope with a registry resource`);
      }
    }
    for (const domain of reportingDomains) {
      if (!seenDomains.has(domain)) fail(`${ASSURANCE_REGISTRY_PATH}: missing reporting ownership for ${domain}`);
    }
    const reportOwner = (reporting.ownership ?? []).find((ownership) => ownership.domain === 'reports');
    if (retained && reportOwner?.source !== retained.id) {
      fail(`${ASSURANCE_REGISTRY_PATH}: reports ownership must resolve to ${retained.id}`);
    }
    const governanceOwner = (reporting.ownership ?? []).find((ownership) => ownership.domain === 'governance');
    if (governanceOwner?.resource && identities.has(governanceOwner.resource)) {
      const ownerResource = resources.find((resource) => resource.id === governanceOwner.resource);
      if (ownerResource?.kind !== 'governance-records') {
        fail(`${ASSURANCE_REGISTRY_PATH}: governance ownership must resolve to the governance-records family`);
      }
    }
  }

  const canonicalFiles = discoverCanonicalAssuranceJson(root);
  const registeredFiles = canonicalAssuranceDatasetPaths(registry);
  const canonicalSet = new Set(canonicalFiles);
  const registeredSet = new Set(registeredFiles);
  for (const relative of canonicalFiles) {
    if (!registeredSet.has(relative)) fail(`${ASSURANCE_REGISTRY_PATH}: unregistered canonical assurance file ${relative}`);
  }
  for (const relative of registeredFiles) {
    if (!canonicalSet.has(relative)) fail(`${ASSURANCE_REGISTRY_PATH}: registered canonical assurance file is missing ${relative}`);
  }

  const primaryKinds = new Map();
  for (const dataset of registry.datasets ?? []) {
    if (primaryKinds.has(dataset.kind)) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate primary dataset family ${dataset.kind}`);
    else primaryKinds.set(dataset.kind, dataset.id);
    if (stableV1Kinds.has(dataset.kind) && !dataset.capabilities?.includes('api-index')) {
      fail(`${ASSURANCE_REGISTRY_PATH}: released v1 primary dataset ${dataset.id} must declare api-index capability`);
    }
  }
  for (const kind of stableV1Kinds) {
    if (!primaryKinds.has(kind)) fail(`${ASSURANCE_REGISTRY_PATH}: missing released v1 primary dataset family ${kind}`);
  }

  try {
    const lifecycleResource = requireAssuranceCapabilityResource(registry, 'lifecycle');
    if (!lifecycleResource.capabilities?.includes('runtime')) {
      fail(`${ASSURANCE_REGISTRY_PATH}: ${lifecycleResource.id} lifecycle capability owner must declare runtime capability for shared Worker/Node loading`);
    }
    if (lifecycleResource.capabilities?.includes('records')) {
      fail(`${ASSURANCE_REGISTRY_PATH}: ${lifecycleResource.id} lifecycle control-plane resource must not declare records capability`);
    }
  } catch (error) {
    fail(`${ASSURANCE_REGISTRY_PATH}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const monitoring = resources.filter((resource) => resource.capabilities?.includes('monitoring'));
  if (monitoring.length !== 1) fail(`${ASSURANCE_REGISTRY_PATH}: expected exactly one monitoring resource; found ${monitoring.length}`);

  const wcagResources = resources.filter((resource) => resource.kind === 'compliance' && resource.framework?.id === 'wcag-2.2');
  const wcagManifests = wcagResources.filter((resource) => resource.capabilities?.includes('manifest'));
  if (wcagManifests.length !== 1) {
    fail(`${ASSURANCE_REGISTRY_PATH}: expected exactly one WCAG compliance manifest resource; found ${wcagManifests.length}`);
  } else {
    const manifestResource = wcagManifests[0];
    const ownedPartitions = (manifestResource.resources ?? [])
      .filter((resource) => resource.kind === 'compliance' && resource.role === 'partition');
    const registeredPartitions = wcagResources
      .filter((resource) => resource.role === 'partition');
    if (ownedPartitions.length !== registeredPartitions.length
      || !registeredPartitions.every((resource) => ownedPartitions.some((owned) => owned.id === resource.id && owned.path === resource.path))) {
      fail(`${ASSURANCE_REGISTRY_PATH}: WCAG partition membership must be owned by the WCAG compliance manifest resource hierarchy`);
    }
  }

  const runtimeIds = resources.filter((resource) => resource.capabilities?.includes('runtime')).map((resource) => resource.id).sort();
  if (new Set(runtimeIds).size !== runtimeIds.length) fail(`${ASSURANCE_REGISTRY_PATH}: duplicate runtime dataset identity`);

  for (const resource of assuranceRecordResources(registry)) {
    if (!resource.capabilities?.includes('runtime')) continue;
    if (!resource.recordCollection?.identity?.length) fail(`${ASSURANCE_REGISTRY_PATH}: ${resource.id} recordCollection.identity must declare immutable identity fields`);
  }

  if (errors.length === 0) {
    try {
      const expectedBinding = renderRuntimeBinding(registry);
      const bindingPath = path.join(root, RUNTIME_BINDING_PATH);
      const currentBinding = fs.existsSync(bindingPath) ? fs.readFileSync(bindingPath, 'utf8') : '';
      if (currentBinding !== expectedBinding) fail(`${RUNTIME_BINDING_PATH}: runtime import binding does not agree with ${ASSURANCE_REGISTRY_PATH}`);
    } catch (error) {
      fail(`${RUNTIME_BINDING_PATH}: unable to derive runtime binding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (errors.length) {
  console.error('Assurance registry completeness/schema validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Assurance registry validation passed: ${flattenAssuranceRegistry(registry).length} registered resources, all canonical assurance JSON registered and schema-valid.`);
