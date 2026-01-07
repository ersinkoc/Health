/**
 * @oxog/health - Runner Plugin Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { runnerPlugin, runnerPluginWithOptions } from '../../src/plugins/core/runner.js';
import type { CheckConfig } from '../../src/types.js';

describe('Runner Plugin runAll Coverage', () => {
  it('should expose runAll through context.runner', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);

    await kernel.init();

    const context = kernel.getContext();
    expect(context.runner).toBeDefined();
    expect(context.runner.runAll).toBeInstanceOf(Function);

    const checks = new Map<string, CheckConfig>([
      [
        'test-check',
        {
          handler: async () => ({ status: 'healthy' as const }),
          timeout: 1000,
        },
      ],
    ]);

    const results = await context.runner.runAll(checks);

    expect(results.size).toBe(1);
    const result = results.get('test-check');
    expect(result).toBeDefined();
    expect(result?.result.status).toBe('healthy');
    expect(result?.duration).toBeGreaterThanOrEqual(0);

    await kernel.destroy();
  });

  it('should pass options to runAll', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);

    await kernel.init();

    const context = kernel.getContext();

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

    const results = await context.runner.runAll(checks, { parallel: true });

    expect(results.size).toBe(2);

    await kernel.destroy();
  });
});

describe('Runner Plugin With Options', () => {
  it('should expose runAll through runnerPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPluginWithOptions({ timeout: 5000, retries: 1 }));

    await kernel.init();

    const context = kernel.getContext();

    const checks = new Map<string, CheckConfig>([
      [
        'test-check',
        {
          handler: async () => ({ status: 'healthy' as const }),
          timeout: 1000,
        },
      ],
    ]);

    const results = await context.runner.runAll(checks);

    expect(results.size).toBe(1);

    await kernel.destroy();
  });
});
