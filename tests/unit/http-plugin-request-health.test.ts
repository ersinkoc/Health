/**
 * @oxog/health - HTTP Plugin Request Health Event Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';

describe('HTTP Plugin request:health Event', () => {
  it('should handle request:health event', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    // Listen for the request:health event response
    let healthResponse: unknown = null;
    kernel.on('request:health', (data) => {
      healthResponse = data;
    });

    await kernel.init();

    // The event should have been set up during install
    // Emit the event to trigger the handler
    kernel.emit('request:health', {});

    // Verify the server is running
    const context = kernel.getContext();
    expect(context.server).toBeDefined();

    await kernel.destroy();
  });

  it('should emit http:installed event during install', async () => {
    const kernel = createHealthKernel({ port: 0, basePath: '/api' });

    let installedData: unknown = null;
    kernel.on('http:installed', (data) => {
      installedData = data;
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    expect(installedData).toBeDefined();
    expect((installedData as { basePath: string }).basePath).toBe('/api');

    await kernel.destroy();
  });
});
