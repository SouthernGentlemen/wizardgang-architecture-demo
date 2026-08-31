import type { DemoDefinition } from '../types';
import demo_edge from './edge';
import demo_workers from './workers';
import demo_durable_objects from './durable-objects';
import demo_d1 from './d1';
import demo_r2 from './r2';
import demo_api from './api';
import demo_rest from './rest';
import demo_openapi from './openapi';
import demo_graphql from './graphql';
import demo_webhooks from './webhooks';
import demo_identity from './identity';
import demo_oauth from './oauth';
import demo_sso from './sso';
import demo_saml from './saml';
import demo_mcp from './mcp';
import demo_i18n from './i18n';
import demo_accessibility from './accessibility';
import demo_git from './git';
import demo_versioning from './versioning';
import demo_branching from './branching';
import demo_releases from './releases';
import demo_actions from './actions';
import demo_environments from './environments';
import demo_traceability from './traceability';
import demo_governance from './governance';
import demo_iso27001 from './iso-27001';
import demo_iso42001 from './iso-42001';
import demo_evidence from './evidence';
import demo_dashboard from './dashboard';
import demo_uptime from './uptime';
import demo_health from './health';
import demo_docs from './docs';
import demo_logs from './logs';
import demo_billing from './billing';

export const demos: DemoDefinition[] = [
  demo_edge,
  demo_workers,
  demo_durable_objects,
  demo_d1,
  demo_r2,
  demo_api,
  demo_rest,
  demo_openapi,
  demo_graphql,
  demo_webhooks,
  demo_identity,
  demo_oauth,
  demo_sso,
  demo_saml,
  demo_mcp,
  demo_i18n,
  demo_accessibility,
  demo_git,
  demo_versioning,
  demo_branching,
  demo_releases,
  demo_actions,
  demo_environments,
  demo_traceability,
  demo_governance,
  demo_iso27001,
  demo_iso42001,
  demo_evidence,
  demo_dashboard,
  demo_uptime,
  demo_health,
  demo_docs,
  demo_logs,
  demo_billing
];

export const demosByRoute = new Map(demos.map((demo) => [demo.route, demo]));
export const demosById = new Map(demos.map((demo) => [demo.id, demo]));
