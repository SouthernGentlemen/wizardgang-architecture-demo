import type { DemoDefinition } from '../types';
import demo_edge from './edge';
import demo_workers from './workers';
import demo_durable_objects from './durable-objects';
import demo_d1 from './d1';
import demo_r2 from './r2';
import demo_api from './api';
import demo_graphql from './graphql';
import demo_webhooks from './webhooks';
import demo_identity from './identity';
import demo_mcp from './mcp';
import demo_i18n from './i18n';
import demo_accessibility from './accessibility';
import demo_git from './git';
import demo_governance from './governance';
import demo_evidence from './evidence';
import demo_compliance from './compliance';
import demo_security from './security';
import demo_concerns from './concerns';
import demo_risks from './risks';
import demo_incidents from './incidents';
import demo_dashboard from './dashboard';
import demo_uptime from './uptime';
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
  demo_graphql,
  demo_webhooks,
  demo_identity,
  demo_mcp,
  demo_i18n,
  demo_accessibility,
  demo_git,
  demo_governance,
  demo_evidence,
  demo_compliance,
  demo_security,
  demo_concerns,
  demo_risks,
  demo_incidents,
  demo_dashboard,
  demo_uptime,
  demo_docs,
  demo_logs,
  demo_billing
];

export const demosByRoute = new Map(demos.map((demo) => [demo.route, demo]));
