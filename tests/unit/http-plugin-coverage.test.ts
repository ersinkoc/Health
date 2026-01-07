/**
 * @oxog/health - HTTP Plugin Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';

describe('HTTP Plugin onDestroy Coverage', () => {
  it('should handle destroy when server exists', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    // Server should exist
    const context = kernel.getContext();
    expect(context.server).toBeDefined();

    // Destroy should close server
    await kernel.destroy();
  });

  it('should handle destroy when server does not exist', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    // No server registered since httpPlugin not used
    const context = kernel.getContext();
    expect(context.server).toBeUndefined();

    // Should not throw
    await kernel.destroy();
  });
});
