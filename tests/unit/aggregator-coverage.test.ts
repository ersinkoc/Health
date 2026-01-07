/**
 * @oxog/health - Aggregator Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createAggregator, Aggregator } from '../../src/core/aggregator.js';
import { createHealthKernel } from '../../src/kernel.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPluginWithOptions } from '../../src/plugins/core/aggregator.js';
import type { CheckResult } from '../../src/types.js';

describe('Aggregator predictStatus Coverage', () => {
  it('should predict healthy status for score >= 80', () => {
    const aggregator = createAggregator();
    expect(aggregator.predictStatus(100)).toBe('healthy');
    expect(aggregator.predictStatus(80)).toBe('healthy');
  });

  it('should predict degraded status for score between 50 and 80', () => {
    const aggregator = createAggregator();
    expect(aggregator.predictStatus(79)).toBe('degraded');
    expect(aggregator.predictStatus(50)).toBe('degraded');
  });

  it('should predict unhealthy status for score below 50', () => {
    const aggregator = createAggregator();
    expect(aggregator.predictStatus(49)).toBe('unhealthy');
    expect(aggregator.predictStatus(0)).toBe('unhealthy');
  });
});

describe('Aggregator Critical Failure Coverage', () => {
  it('should return unhealthy when critical check fails', () => {
    const aggregator = createAggregator();

    // Use aggregateSimple with results that include critical flag in CheckResult
    const results = new Map<string, CheckResult>([
      ['db', { status: 'unhealthy', error: 'Connection refused', critical: true }],
      ['cache', { status: 'healthy' }],
    ]);

    const status = aggregator.aggregateSimple(results, 0);

    // Even with some checks healthy, critical failure means unhealthy
    expect(status.status).toBe('unhealthy');
  });
});

describe('Aggregator Plugin setThresholds Coverage', () => {
  it('should expose setThresholds through context.aggregator', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(aggregatorPluginWithOptions({ healthy: 80, degraded: 60 }));

    await kernel.init();

    const context = kernel.getContext();
    expect(context.aggregator.setThresholds).toBeInstanceOf(Function);

    // Change thresholds
    context.aggregator.setThresholds({ healthy: 90, degraded: 70 });

    const thresholds = context.aggregator.getThresholds();
    expect(thresholds.healthy).toBe(90);
    expect(thresholds.degraded).toBe(70);

    await kernel.destroy();
  });
});
