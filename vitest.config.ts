import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { maxWorkers: 2 },
  ssr: { noExternal: true },
});
