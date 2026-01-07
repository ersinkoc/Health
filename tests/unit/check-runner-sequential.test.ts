/**
 * @oxog/health - CheckRunner Sequential Execution Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createCheckRunner } from '../../src/core/check-runner.js';
import type { CheckConfig } from '../../src/types.js';
import { sleep } from '../../src/utils/promise.js';

describe('CheckRunner Sequential Execution', () => {
  it('should run checks sequentially when parallel=false', async () => {
    const runner = createCheckRunner();
    const executionOrder: string[] = [];

    const checks = new Map<string, CheckConfig>([
      [
        'check1',
        {
          handler: async () => {
            executionOrder.push('start-1');
            await sleep(10);
            executionOrder.push('end-1');
            return { status: 'healthy' as const };
          },
          timeout: 1000,
        },
      ],
      [
        'check2',
        {
          handler: async () => {
            executionOrder.push('start-2');
            await sleep(10);
            executionOrder.push('end-2');
            return { status: 'healthy' as const };
          },
          timeout: 1000,
        },
      ],
    ]);

    const results = await runner.runAll(checks, { parallel: false });

    expect(results.size).toBe(2);
    // Sequential: start-1, end-1, start-2, end-2
    expect(executionOrder).toEqual(['start-1', 'end-1', 'start-2', 'end-2']);
  });

  it('should stop on failure when stopOnFailure=true in sequential mode', async () => {
    const runner = createCheckRunner();
    const executed: string[] = [];

    const checks = new Map<string, CheckConfig>([
      [
        'check1',
        {
          handler: async () => {
            executed.push('check1');
            return { status: 'healthy' as const };
          },
          timeout: 1000,
        },
      ],
      [
        'check2',
        {
          handler: async () => {
            executed.push('check2');
            return { status: 'unhealthy' as const, error: 'failed' };
          },
          timeout: 1000,
        },
      ],
      [
        'check3',
        {
          handler: async () => {
            executed.push('check3');
            return { status: 'healthy' as const };
          },
          timeout: 1000,
        },
      ],
    ]);

    const results = await runner.runAll(checks, { parallel: false, stopOnFailure: true });

    // Should stop after check2 fails
    expect(executed).toContain('check1');
    expect(executed).toContain('check2');
    expect(executed).not.toContain('check3');
    expect(results.size).toBe(2);
  });
});
