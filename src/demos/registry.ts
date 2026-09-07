import type { DemoDefinition } from '../types';
import demo_platform from './platform';
import demo_interfaces from './interfaces';
import demo_assurance from './assurance';
import demo_security from './security';
import demo_operations from './operations';

export const demos: DemoDefinition[] = [
  demo_platform,
  demo_interfaces,
  demo_assurance,
  demo_security,
  demo_operations,
];
