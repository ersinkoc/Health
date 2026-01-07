/**
 * @oxog/health - CheckRunner Concurrency Tests
 */

import { describe, it, expect } from 'vitest';
import { createCheckRunner } from '../../src/core/check-runner.js';
import type { CheckConfig } from '../../src/types.js';
import { sleep } from '../../src/utils/promise.js';

describe('CheckRunner runWithConcurrency', () => {
  it('should run a single check with concurrency', async () => {
    const runner = createCheckRunner();

    const checks = new Map<string, CheckConfig>([
      [
        'check1',
        {
          handler: async () => {
            return { status: 'healthy' as const };
          },
          timeout: 5000,
        },
      ],
    ]);

    const results = await runner.runWithConcurrency(checks, 2);

    expect(results.size).toBe(1);
    const result = results.get('check1');
    expect(result?.result.status).toBe('healthy');
  });

  it('should handle empty checks map', async () => {
    const runner = createCheckRunner();
    const results = await runner.runWithConcurrency(new Map(), 2);
    expect(results.size).toBe(0);
  });
});
