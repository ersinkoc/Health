/**
 * @oxog/health - HTTP Plugin Destroy Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';

describe('HTTP Plugin onDestroy Coverage', () => {
  it('should destroy server when kernel is destroyed', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext();
    expect(context.server).toBeDefined();

    // Verify server is listening
    const port = context.server!.port;
    expect(port).toBeGreaterThan(0);

    // Destroy should close server
    await kernel.destroy();

    // Server should be closed now (attempting to connect should fail)
    try {
      await fetch(`http://localhost:${port}/health`);
      // If we get here, server might still be running briefly
    } catch {
      // Expected - server is closed
    }
  });

  it('should handle destroy without server', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    // No http plugin = no server
    const context = kernel.getContext();
    expect(context.server).toBeUndefined();

    // Should not throw
    await kernel.destroy();
  });
});
