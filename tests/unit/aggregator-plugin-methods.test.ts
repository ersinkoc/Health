/**
 * @oxog/health - Aggregator Plugin Methods Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPluginWithOptions } from '../../src/plugins/core/aggregator.js';
import type { CheckResult } from '../../src/types.js';

describe('Aggregator Plugin Methods', () => {
  it('should aggregate results using aggregateSimple via plugin', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(aggregatorPluginWithOptions({ healthy: 80, degraded: 60 }));

    await kernel.init();

    const context = kernel.getContext();

    // Create test results
    const results = new Map<string, CheckResult>([
      ['check1', { status: 'healthy' }],
      ['check2', { status: 'healthy' }],
    ]);

    // Aggregate results - this triggers line 109
    const status = context.aggregator.aggregate(results, 100);

    expect(status.status).toBe('healthy');
    expect(status.score).toBeGreaterThan(0);

    await kernel.destroy();
  });

  it('should get and set thresholds via plugin', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(aggregatorPluginWithOptions({ healthy: 75, degraded: 55 }));

    await kernel.init();

    const context = kernel.getContext();

    const thresholds = context.aggregator.getThresholds();
    expect(thresholds.healthy).toBe(75);
    expect(thresholds.degraded).toBe(55);

    context.aggregator.setThresholds({ healthy: 85, degraded: 65 });

    const updatedThresholds = context.aggregator.getThresholds();
    expect(updatedThresholds.healthy).toBe(85);
    expect(updatedThresholds.degraded).toBe(65);

    await kernel.destroy();
  });
});
