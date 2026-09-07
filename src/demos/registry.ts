import type { DemoDefinition } from '../types';
import demo_platform from './platform';
import demo_interfaces from './interfaces';
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
  demo_platform,
  demo_interfaces,
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
  demo_billing,
];
