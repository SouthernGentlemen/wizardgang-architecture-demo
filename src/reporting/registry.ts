import reportingRegistryData from '../../assurance/registry.json';
import type { AssuranceRegistryResource } from '../assurance/model';
import type { ReportingCapability, ReportingSource, ReportingVisibility } from './contracts';

interface StructuredRecordSourceDeclaration {
  id: string;
  provider: 'github';
  authority: 'structured-record';
  repository: string;
  resourceRoot: string;
  nativeIdentity: string[];
  revisionIdentity: string[];
  capabilities: ReportingCapability[];
  ingestion: 'enabled';
}

interface ReportingOwnershipDeclaration {
  domain: 'evidence' | 'reports' | 'issues' | 'risks' | 'security' | 'governance' | 'operations';
  source: string;
  resource?: string;
}

interface ReportingRegistryDeclaration {
  contract: string;
  structuredRecords: StructuredRecordSourceDeclaration;
  nativeObjects: ReportingSource[];
  observations: ReportingSource[];
  privateSources: ReportingSource[];
  ownership: ReportingOwnershipDeclaration[];
  privateIngestion: 'disabled';
}

const reporting = (reportingRegistryData as unknown as { reporting: ReportingRegistryDeclaration }).reporting;

export const reportingContractPath = reporting.contract;
export const reportingOwnership = reporting.ownership as readonly ReportingOwnershipDeclaration[];

function copySource(source: ReportingSource): ReportingSource {
  return {
    ...source,
    scope: { ...source.scope },
    nativeIdentity: [...source.nativeIdentity],
    ...(source.revisionIdentity ? { revisionIdentity: [...source.revisionIdentity] } : {}),
    ...(source.observationIdentity ? { observationIdentity: [...source.observationIdentity] } : {}),
    capabilities: [...source.capabilities],
  };
}

export function registeredReportingSources(): readonly ReportingSource[] {
  return [...reporting.nativeObjects, ...reporting.observations, ...reporting.privateSources].map(copySource);
}

export function registeredReportingSource(id: string): ReportingSource {
  const source = registeredReportingSources().find((candidate) => candidate.id === id);
  if (!source) throw new Error(`Reporting source ${id} is not declared in assurance/registry.json.`);
  return source;
}

export function structuredReportingSource(resource: AssuranceRegistryResource): ReportingSource {
  const declaration = reporting.structuredRecords;
  if (!resource.path.startsWith(declaration.resourceRoot)) {
    throw new Error(`${resource.id} is outside the structured reporting source scope ${declaration.resourceRoot}.`);
  }
  const visibility = resource.visibility as ReportingVisibility;
  const privateResource = visibility === 'private';
  return {
    id: `${declaration.id}.${resource.id}`,
    provider: declaration.provider,
    authority: declaration.authority,
    scope: { repository: declaration.repository, resource: resource.path },
    nativeIdentity: [...declaration.nativeIdentity],
    revisionIdentity: [...declaration.revisionIdentity],
    schema: resource.schema,
    visibility,
    capabilities: privateResource
      ? declaration.capabilities.filter((capability) => capability !== 'import')
      : [...declaration.capabilities],
    ingestion: privateResource ? reporting.privateIngestion : declaration.ingestion,
  };
}

export function reportingSourceForOwnership(domain: ReportingOwnershipDeclaration['domain'], resource?: AssuranceRegistryResource): ReportingSource {
  const owner = reporting.ownership.find((candidate) => candidate.domain === domain);
  if (!owner) throw new Error(`Reporting domain ${domain} has no authoritative owner.`);
  if (owner.source === reporting.structuredRecords.id) {
    if (!resource) throw new Error(`Reporting domain ${domain} requires its registered structured resource.`);
    if (owner.resource && owner.resource !== resource.id) throw new Error(`Reporting domain ${domain} is owned by ${owner.resource}, not ${resource.id}.`);
    return structuredReportingSource(resource);
  }
  return registeredReportingSource(owner.source);
}
