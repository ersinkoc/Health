/**
 * @oxog/health - Thresholds Plugin Reset Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';
import { thresholdsPluginWithOptions } from '../../src/plugins/optional/thresholds.js';

describe('Thresholds Plugin Reset', () => {
  it('should reset thresholds to initial values', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPluginWithOptions({ healthy: 80, degraded: 60 }));

    await kernel.init();

    const context = kernel.getContext();

    // Get initial thresholds
    const initial = context.thresholds.get();
    expect(initial.healthy).toBe(80);
    expect(initial.degraded).toBe(60);

    // Update thresholds
    context.thresholds.set({ healthy: 90, degraded: 70 });

    const updated = context.thresholds.get();
    expect(updated.healthy).toBe(90);
    expect(updated.degraded).toBe(70);

    // Reset thresholds - triggers lines 178-179
    context.thresholds.reset();

    const reset = context.thresholds.get();
    expect(reset.healthy).toBe(80);
    expect(reset.degraded).toBe(60);

    await kernel.destroy();
  });

  it('should reset to default values when no options provided', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPluginWithOptions({}));

    await kernel.init();

    const context = kernel.getContext();

    // Update thresholds
    context.thresholds.set({ healthy: 95, degraded: 75 });

    // Reset to defaults (80 and 50)
    context.thresholds.reset();

    const reset = context.thresholds.get();
    expect(reset.healthy).toBe(80);
    expect(reset.degraded).toBe(50);

    await kernel.destroy();
  });
});
