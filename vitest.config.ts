import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'website/',
        'examples/',
        '*.config.*',
        '**/*.d.ts',
        '**/dist/**',
        'src/index.ts',           // Barrel file - just re-exports
        'src/types.ts',           // Type definitions only
        'src/plugins/index.ts',   // Plugin barrel file
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    testTimeout: 10000,
  },
});
