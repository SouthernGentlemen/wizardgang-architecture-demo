import type { DemoDefinition } from '../types';

const demo: DemoDefinition = {
  id: 'dashboard',
  route: '/dashboard',
  title: 'Operations Dashboard',
  group: 'Operations',
  sourcePath: 'src/demos/dashboard.ts',
  summary: 'Public operational surface that brings uptime, health, documentation, public-safe logs, and demo billing together without exposing account secrets.',
  proves: [
    'Single operational entry point',
    'Links operational state back to public implementation code',
    'Separates public telemetry from private account configuration',
    'Provides bounded public-safe application log visibility alongside health and uptime'
  ],
  status: 'scaffolded'
};

export default demo;
