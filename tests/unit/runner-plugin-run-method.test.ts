/**
 * @oxog/health - Runner Plugin Run Method Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { runnerPluginWithOptions } from '../../src/plugins/core/runner.js';
import type { CheckConfig } from '../../src/types.js';

describe('Runner Plugin Run Method', () => {
  it('should run single check via plugin run method', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPluginWithOptions({ timeout: 5000, retries: 1 }));

    await kernel.init();

    const context = kernel.getContext();

    const config: CheckConfig = {
      handler: async () => ({ status: 'healthy' as const }),
      timeout: 1000,
    };

    // This triggers runner.ts line 252-254
    const result = await context.runner.run('testCheck', config);

    expect(result.result.status).toBe('healthy');
    expect(result.duration).toBeDefined();

    await kernel.destroy();
  });

  it('should run unhealthy check via plugin run method', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPluginWithOptions({ timeout: 5000 }));

    await kernel.init();

    const context = kernel.getContext();

    const config: CheckConfig = {
      handler: async () => ({ status: 'unhealthy' as const, error: 'Test error' }),
      timeout: 1000,
    };

    const result = await context.runner.run('failingCheck', config);

    expect(result.result.status).toBe('unhealthy');
    expect(result.duration).toBeGreaterThanOrEqual(0);

    await kernel.destroy();
  });
});
