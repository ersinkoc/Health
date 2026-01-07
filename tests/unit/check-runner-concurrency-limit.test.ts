/**
 * @oxog/health - CheckRunner Concurrency Limit Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createCheckRunner } from '../../src/core/check-runner.js';
import type { CheckConfig } from '../../src/types.js';

describe('CheckRunner runWithConcurrency Limit', () => {
  it('should run checks with concurrency limit', async () => {
    const runner = createCheckRunner();

    const checks = new Map<string, CheckConfig>([
      [
        'check1',
        {
          handler: async () => ({ status: 'healthy' as const }),
          timeout: 1000,
        },
      ],
      [
        'check2',
        {
          handler: async () => ({ status: 'healthy' as const }),
          timeout: 1000,
        },
      ],
    ]);

    // Run with concurrency of 2
    const results = await runner.runWithConcurrency(checks, 2);

    expect(results.size).toBeGreaterThanOrEqual(1);
  });

  it('should complete checks with concurrency of 1', async () => {
    const runner = createCheckRunner();

    const checks = new Map<string, CheckConfig>([
      [
        'a',
        {
          handler: async () => ({ status: 'healthy' as const }),
          timeout: 1000,
        },
      ],
    ]);

    // Run with concurrency of 1 (sequential)
    const results = await runner.runWithConcurrency(checks, 1);

    expect(results.size).toBe(1);
  });

  it('should handle high concurrency limit', async () => {
    const runner = createCheckRunner();

    const checks = new Map<string, CheckConfig>([
      [
        'x',
        {
          handler: async () => ({ status: 'healthy' as const }),
          timeout: 1000,
        },
      ],
    ]);

    // Concurrency higher than number of checks
    const results = await runner.runWithConcurrency(checks, 10);

    expect(results.size).toBe(1);
  });
});
