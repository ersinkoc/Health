import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
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
      all: false,
      thresholds: {
        lines: 98,
        functions: 98,
        branches: 95,
        statements: 98,
      },
    },
    testTimeout: 10000,
  },
});
