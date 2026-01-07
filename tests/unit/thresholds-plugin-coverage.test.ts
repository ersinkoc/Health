/**
 * @oxog/health - Thresholds Plugin Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';
import { thresholdsPluginWithOptions, isValidThreshold } from '../../src/plugins/optional/thresholds.js';

describe('ThresholdsPluginWithOptions Coverage', () => {
  it('should use thresholdsPluginWithOptions with set method', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPluginWithOptions({ healthy: 90, degraded: 60 }));

    await kernel.init();

    const context = kernel.getContext();

    // Test get method
    expect(context.thresholds.get().healthy).toBe(90);
    expect(context.thresholds.get().degraded).toBe(60);

    // Test set method - update only healthy
    context.thresholds.set({ healthy: 85 });
    expect(context.thresholds.get().healthy).toBe(85);
    expect(context.thresholds.get().degraded).toBe(60);

    // Test set method - update only degraded
    context.thresholds.set({ degraded: 55 });
    expect(context.thresholds.get().healthy).toBe(85);
    expect(context.thresholds.get().degraded).toBe(55);

    // Test set method - update both
    context.thresholds.set({ healthy: 95, degraded: 70 });
    expect(context.thresholds.get().healthy).toBe(95);
    expect(context.thresholds.get().degraded).toBe(70);

    await kernel.destroy();
  });

  it('should use thresholdsPluginWithOptions with reset method', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPluginWithOptions({ healthy: 85, degraded: 55 }));

    await kernel.init();

    const context = kernel.getContext();

    // Change thresholds
    context.thresholds.set({ healthy: 95, degraded: 70 });
    expect(context.thresholds.get().healthy).toBe(95);
    expect(context.thresholds.get().degraded).toBe(70);

    // Reset - should return to the plugin options defaults, not global defaults
    context.thresholds.reset();
    expect(context.thresholds.get().healthy).toBe(85);
    expect(context.thresholds.get().degraded).toBe(55);

    await kernel.destroy();
  });

  it('should throw on invalid threshold values in set', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPluginWithOptions({ healthy: 80, degraded: 50 }));

    await kernel.init();

    const context = kernel.getContext();

    // Should throw for value > 100
    expect(() => context.thresholds.set({ healthy: 150 })).toThrow();

    // Should throw for value < 0
    expect(() => context.thresholds.set({ degraded: -10 })).toThrow();

    // Should throw for NaN
    expect(() => context.thresholds.set({ healthy: NaN })).toThrow();

    await kernel.destroy();
  });

  it('should use default values when options not provided', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPluginWithOptions({}));

    await kernel.init();

    const context = kernel.getContext();

    // Should use default values (80, 50)
    expect(context.thresholds.get().healthy).toBe(80);
    expect(context.thresholds.get().degraded).toBe(50);

    await kernel.destroy();
  });
});

describe('isValidThreshold Function Coverage', () => {
  it('should validate boundary values', () => {
    expect(isValidThreshold(0)).toBe(true);
    expect(isValidThreshold(100)).toBe(true);
    expect(isValidThreshold(50.5)).toBe(true);
  });

  it('should reject invalid values', () => {
    expect(isValidThreshold(-0.1)).toBe(false);
    expect(isValidThreshold(100.1)).toBe(false);
    expect(isValidThreshold(Infinity)).toBe(false);
    expect(isValidThreshold(-Infinity)).toBe(false);
  });

  it('should reject non-numeric values', () => {
    expect(isValidThreshold('50')).toBe(false);
    expect(isValidThreshold(true)).toBe(false);
    expect(isValidThreshold(false)).toBe(false);
    expect(isValidThreshold(null)).toBe(false);
    expect(isValidThreshold(undefined)).toBe(false);
    expect(isValidThreshold({})).toBe(false);
    expect(isValidThreshold([])).toBe(false);
  });
});
