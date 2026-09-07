import type { DemoDefinition } from '../types';
import demo_platform from './platform';
import demo_interfaces from './interfaces';
import demo_assurance from './assurance';
import demo_security from './security';
import demo_dashboard from './dashboard';
import demo_uptime from './uptime';
import demo_docs from './docs';
import demo_logs from './logs';
import demo_billing from './billing';

export const demos: DemoDefinition[] = [
  demo_platform,
  demo_interfaces,
  demo_assurance,
  demo_security,
  demo_dashboard,
  demo_uptime,
  demo_docs,
  demo_logs,
  demo_billing,
];
