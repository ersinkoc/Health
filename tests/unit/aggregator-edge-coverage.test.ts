/**
 * @oxog/health - Aggregator Edge Cases Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createAggregator } from '../../src/core/aggregator.js';
import type { CheckResult } from '../../src/types.js';

describe('Aggregator Edge Cases', () => {
  it('should return score 100 when totalWeight is 0 (empty results)', () => {
    const aggregator = createAggregator();

    // Empty results - triggers line 157 (totalWeight === 0 branch)
    const results = new Map<string, CheckResult>();
    const status = aggregator.aggregateSimple(results, 100);

    expect(status.score).toBe(100);
    expect(status.status).toBe('healthy');
  });

  it('should return getDegradedThreshold correctly', () => {
    const aggregator = createAggregator({ healthy: 80, degraded: 60 });

    // Triggers lines 292-293
    const degradedThreshold = aggregator.getDegradedThreshold();
    expect(degradedThreshold).toBe(60);
  });

  it('should return getHealthyThreshold correctly', () => {
    const aggregator = createAggregator({ healthy: 85, degraded: 55 });

    const healthyThreshold = aggregator.getHealthyThreshold();
    expect(healthyThreshold).toBe(85);
  });
});
