/**
 * @oxog/health - Kernel Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';

describe('Kernel Coverage - State Methods', () => {
  it('should check isInitialized state', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    // Before init
    expect(kernel.isInitialized()).toBe(false);

    await kernel.init();

    // After init
    expect(kernel.isInitialized()).toBe(true);

    await kernel.destroy();
  });

  it('should check isDestroyed state', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    // Before destroy
    expect(kernel.isDestroyed()).toBe(false);

    await kernel.init();

    // After init but before destroy
    expect(kernel.isDestroyed()).toBe(false);

    await kernel.destroy();

    // After destroy
    expect(kernel.isDestroyed()).toBe(true);
  });

  it('should remain initialized after init', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    expect(kernel.isInitialized()).toBe(false);
    expect(kernel.isDestroyed()).toBe(false);

    await kernel.init();

    expect(kernel.isInitialized()).toBe(true);
    expect(kernel.isDestroyed()).toBe(false);

    await kernel.destroy();

    expect(kernel.isInitialized()).toBe(true);  // Still true after destroy
    expect(kernel.isDestroyed()).toBe(true);
  });
});
