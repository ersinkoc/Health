/**
 * @oxog/health - Aggregator Tests
 */

import { describe, it, expect } from 'vitest';
import { Aggregator, createAggregator } from '../../src/core/aggregator.js';
import type { CheckResult } from '../../src/types.js';
import type { RunResult } from '../../src/core/check-runner.js';

describe('Aggregator', () => {
  describe('aggregate', () => {
    it('should return healthy status for all passing checks', () => {
      const aggregator = createAggregator({ healthy: 80, degraded: 50 });

      const results = new Map<string, RunResult>();
      results.set('check1', { name: 'check1', result: { status: 'healthy' }, duration: 5, attempts: 1 });
      results.set('check2', { name: 'check2', result: { status: 'healthy' }, duration: 5, attempts: 1 });

      const status = aggregator.aggregate(results, 3600);

      expect(status.status).toBe('healthy');
      expect(status.score).toBe(100);
    });

    it('should return degraded status when score is between thresholds', () => {
      const aggregator = createAggregator({ healthy: 80, degraded: 50 });

      const results = new Map<string, RunResult>();
      results.set('check1', { name: 'check1', result: { status: 'healthy' }, duration: 5, attempts: 1 });
      results.set('check2', { name: 'check2', result: { status: 'unhealthy' }, duration: 5, attempts: 1 });

      const status = aggregator.aggregate(results, 3600);

      expect(status.status).toBe('degraded');
      expect(status.score).toBe(50);
    });

    it('should return unhealthy status when critical check fails', () => {
      const aggregator = createAggregator({ healthy: 80, degraded: 50 });

      const results = new Map<string, RunResult>();
      results.set('check1', { name: 'check1', result: { status: 'healthy' }, duration: 5, attempts: 1 });
      results.set('check2', { name: 'check2', result: { status: 'unhealthy', critical: true }, duration: 5, attempts: 1 });

      const status = aggregator.aggregate(results, 3600);

      expect(status.status).toBe('unhealthy');
    });

    it('should return healthy status when no checks are registered', () => {
      const aggregator = createAggregator();

      const results = new Map<string, RunResult>();
      const status = aggregator.aggregate(results, 3600);

      expect(status.status).toBe('healthy');
      expect(status.score).toBe(100);
      expect(status.checks).toEqual({});
    });

    it('should include check details in response', () => {
      const aggregator = createAggregator();

      const results = new Map<string, RunResult>();
      results.set('database', {
        name: 'database',
        result: { status: 'healthy', latency: 10 },
        duration: 10,
        attempts: 1,
      });

      const status = aggregator.aggregate(results, 3600);

      expect(status.checks.database).toBeDefined();
      expect(status.checks.database.status).toBe('healthy');
      expect(status.checks.database.latency).toBe(10);
      expect(status.checks.database.lastCheck).toBeDefined();
    });

    it('should use custom weights', () => {
      const aggregator = createAggregator();

      const results = new Map<string, RunResult>();
      results.set('critical', {
        name: 'critical',
        result: { status: 'healthy', weight: 80 },
        duration: 5,
        attempts: 1,
      });
      results.set('optional', {
        name: 'optional',
        result: { status: 'healthy', weight: 20 },
        duration: 5,
        attempts: 1,
      });

      const status = aggregator.aggregate(results, 3600);

      expect(status.score).toBe(100);
    });
  });

  describe('aggregateSimple', () => {
    it('should aggregate simple results', () => {
      const aggregator = createAggregator();

      const results = new Map<string, CheckResult>();
      results.set('check1', { status: 'healthy' });
      results.set('check2', { status: 'healthy' });

      const status = aggregator.aggregateSimple(results, 3600);

      expect(status.status).toBe('healthy');
      expect(status.score).toBe(100);
    });

    it('should handle degraded status', () => {
      const aggregator = createAggregator();

      const results = new Map<string, CheckResult>();
      results.set('check1', { status: 'healthy' });
      results.set('check2', { status: 'degraded' });

      const status = aggregator.aggregateSimple(results, 3600);

      expect(status.status).toBe('degraded');
    });
  });

  describe('getThresholds', () => {
    it('should return current thresholds', () => {
      const aggregator = createAggregator({ healthy: 90, degraded: 60 });

      const thresholds = aggregator.getThresholds();

      expect(thresholds.healthy).toBe(90);
      expect(thresholds.degraded).toBe(60);
    });
  });

  describe('setThresholds', () => {
    it('should update thresholds dynamically', () => {
      const aggregator = createAggregator({ healthy: 80, degraded: 50 });

      aggregator.setThresholds({ healthy: 90, degraded: 60 });

      const thresholds = aggregator.getThresholds();
      expect(thresholds.healthy).toBe(90);
      expect(thresholds.degraded).toBe(60);
    });
  });

  describe('predictStatus', () => {
    it('should predict healthy for high score', () => {
      const aggregator = createAggregator({ healthy: 80, degraded: 50 });

      expect(aggregator.predictStatus(90)).toBe('healthy');
      expect(aggregator.predictStatus(80)).toBe('healthy');
    });

    it('should predict degraded for medium score', () => {
      const aggregator = createAggregator({ healthy: 80, degraded: 50 });

      expect(aggregator.predictStatus(79)).toBe('degraded');
      expect(aggregator.predictStatus(50)).toBe('degraded');
    });

    it('should predict unhealthy for low score', () => {
      const aggregator = createAggregator({ healthy: 80, degraded: 50 });

      expect(aggregator.predictStatus(49)).toBe('unhealthy');
      expect(aggregator.predictStatus(0)).toBe('unhealthy');
    });
  });
});
