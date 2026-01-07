/**
 * @oxog/health - Aggregator Methods Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createAggregator } from '../../src/core/aggregator.js';
import type { CheckResult } from '../../src/types.js';

describe('Aggregator Critical Check Coverage', () => {
  it('should mark status as unhealthy when critical check fails', () => {
    const aggregator = createAggregator({ healthy: 70, degraded: 50 });

    // All checks healthy, but one is critical and unhealthy
    const results = new Map<string, CheckResult>([
      ['db', { status: 'unhealthy', critical: true, error: 'Connection refused' }],
      ['cache', { status: 'healthy' }],
      ['api', { status: 'healthy' }],
    ]);

    const status = aggregator.aggregateSimple(results, 3600);

    // Critical failure should make overall status unhealthy
    expect(status.status).toBe('unhealthy');
  });

  it('should return healthy when critical checks pass', () => {
    const aggregator = createAggregator({ healthy: 70, degraded: 50 });

    const results = new Map<string, CheckResult>([
      ['db', { status: 'healthy', critical: true }],
      ['cache', { status: 'healthy' }],
    ]);

    const status = aggregator.aggregateSimple(results, 3600);

    expect(status.status).toBe('healthy');
  });
});

describe('Aggregator predictStatus Coverage', () => {
  it('should predict status based on custom thresholds', () => {
    const aggregator = createAggregator({ healthy: 90, degraded: 60 });

    expect(aggregator.predictStatus(100)).toBe('healthy');
    expect(aggregator.predictStatus(90)).toBe('healthy');
    expect(aggregator.predictStatus(89)).toBe('degraded');
    expect(aggregator.predictStatus(60)).toBe('degraded');
    expect(aggregator.predictStatus(59)).toBe('unhealthy');
    expect(aggregator.predictStatus(0)).toBe('unhealthy');
  });
});

describe('Aggregator getHealthyThreshold Coverage', () => {
  it('should return healthy threshold', () => {
    const aggregator = createAggregator({ healthy: 85, degraded: 55 });

    expect(aggregator.getHealthyThreshold()).toBe(85);
  });
});
