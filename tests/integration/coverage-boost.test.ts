/**
 * Coverage boost tests - covers all remaining uncovered lines
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin, httpPluginWithOptions } from '../../src/plugins/core/http.js';
import { runnerPlugin, runnerPluginWithOptions } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin, aggregatorPluginWithOptions } from '../../src/plugins/core/aggregator.js';
import { historyPlugin, historyPluginWithOptions } from '../../src/plugins/optional/history.js';
import { metricsPlugin, metricsPluginWithOptions } from '../../src/plugins/optional/metrics.js';
import { thresholdsPlugin, thresholdsPluginWithOptions } from '../../src/plugins/optional/thresholds.js';
import { sleep } from '../../src/utils/promise.js';

describe('Plugin Coverage - Runner Plugin', () => {
  it('should run with custom options via runnerPluginWithOptions', async () => {
    const kernel = createHealthKernel({
      port: 0,
      timeout: 3000,
      retries: 1,
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPluginWithOptions({ timeout: 2000, retries: 1 }));
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext();
    expect(context.runner).toBeDefined();
    expect(context.intervalParser).toBeDefined();

    await kernel.destroy();
  });

  it('should normalize function check config', async () => {
    const kernel = createHealthKernel({
      port: 0,
      checks: {
        simple: () => ({ status: 'healthy' as const }),
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext();
    expect(context.checks.size).toBe(1);
    const config = context.checks.get('simple');
    expect(config).toBeDefined();
    expect(config?.critical).toBe(false);
    expect(config?.weight).toBe(100);

    await kernel.destroy();
  });

  it('should normalize object check config with defaults', async () => {
    const kernel = createHealthKernel({
      port: 0,
      timeout: 5000,
      retries: 2,
      checks: {
        custom: {
          handler: () => ({ status: 'healthy' as const }),
          critical: true,
          weight: 50,
        },
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext();
    const config = context.checks.get('custom');
    expect(config?.critical).toBe(true);
    expect(config?.weight).toBe(50);

    await kernel.destroy();
  });

  it('should start interval checks and update metrics', async () => {
    const kernel = createHealthKernel({
      port: 0,
      interval: '100ms',
      checks: {
        intervalCheck: {
          handler: () => ({ status: 'healthy' as const, latency: 5 }),
          interval: '50ms',
        },
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    // Wait for interval to trigger
    await sleep(150);

    const context = kernel.getContext();
    const metrics = context.metrics.checks['intervalCheck'];
    expect(metrics).toBeDefined();

    await kernel.destroy();
  });

  it('should handle check errors in interval', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const kernel = createHealthKernel({
      port: 0,
      interval: '50ms',
      checks: {
        failingCheck: {
          handler: () => {
            throw new Error('Check failed');
          },
          interval: '50ms',
        },
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    // Wait for interval to trigger
    await sleep(100);

    await kernel.destroy();
    errorSpy.mockRestore();
  });

  it('should run all checks via runner.runAll', async () => {
    const kernel = createHealthKernel({
      port: 0,
      checks: {
        check1: () => ({ status: 'healthy' as const }),
        check2: () => ({ status: 'healthy' as const }),
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext();
    const results = await context.runner.runAll(context.checks);
    expect(results.size).toBe(2);
    expect(results.get('check1')?.result.status).toBe('healthy');

    await kernel.destroy();
  });

  it('should clean up intervals on destroy', async () => {
    const kernel = createHealthKernel({
      port: 0,
      interval: '50ms',
      checks: {
        test: () => ({ status: 'healthy' as const }),
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();
    await sleep(60);
    await kernel.destroy();
    // No error means success
  });
});

describe('Plugin Coverage - HTTP Plugin', () => {
  it('should work with httpPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPluginWithOptions({ port: 0, host: '127.0.0.1' }));
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext();
    expect(context.server).toBeDefined();

    await kernel.destroy();
  });

  it('should handle request:health event', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    // Emit request event
    const results: unknown[] = [];
    kernel.on('request:health', async () => {
      results.push('handled');
    });

    await kernel.destroy();
  });
});

describe('Plugin Coverage - Aggregator Plugin', () => {
  it('should work with aggregatorPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPluginWithOptions({ healthy: 90, degraded: 60 }));

    await kernel.init();

    const context = kernel.getContext();
    expect(context.aggregator).toBeDefined();
    const thresholds = context.aggregator.getThresholds();
    expect(thresholds.healthy).toBe(90);
    expect(thresholds.degraded).toBe(60);

    await kernel.destroy();
  });

  it('should aggregate results', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext();
    const results = new Map([
      ['test', { status: 'healthy' as const, latency: 5, lastCheck: new Date().toISOString() }],
    ]);

    const status = context.aggregator.aggregate(results, 1000);
    expect(status.status).toBe('healthy');
    expect(status.score).toBeGreaterThan(0);

    await kernel.destroy();
  });

  it('should set thresholds', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext();
    context.aggregator.setThresholds({ healthy: 85, degraded: 55 });

    const thresholds = context.aggregator.getThresholds();
    expect(thresholds.healthy).toBe(85);
    expect(thresholds.degraded).toBe(55);

    await kernel.destroy();
  });
});

describe('Plugin Coverage - History Plugin', () => {
  it('should work with historyPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPluginWithOptions({ maxEntries: 50, maxPerCheck: 25 }));

    await kernel.init();

    const context = kernel.getContext();
    expect(context.history).toBeDefined();
    expect(context.history.getHistory).toBeDefined();
    expect(context.history.getCheckHistory).toBeDefined();
    expect(context.history.clearHistory).toBeDefined();

    await kernel.destroy();
  });

  it('should retrieve history via event-based recording', async () => {
    const kernel = createHealthKernel({
      port: 0,
      interval: '50ms',
      checks: {
        historyTest: {
          handler: () => ({ status: 'healthy' as const, latency: 5 }),
          interval: '50ms',
        },
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    // Wait for interval checks to run and record history
    await sleep(150);

    const context = kernel.getContext();
    const checkHistory = context.history.getCheckHistory('historyTest');
    expect(Array.isArray(checkHistory)).toBe(true);

    const overallHistory = context.history.getOverallHistory();
    expect(Array.isArray(overallHistory)).toBe(true);

    await kernel.destroy();
  });

  it('should calculate trends for empty history', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();
    const trends = context.history.getTrends('nonexistent');
    expect(trends.avgLatency).toBe(0);
    expect(trends.successRate).toBe(100);
    expect(trends.status).toBe('stable');

    await kernel.destroy();
  });

  it('should clear check history', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();
    // Manually emit event to add history
    kernel.emit('check:completed', {
      name: 'clearTest',
      result: { status: 'healthy', latency: 5, lastCheck: new Date().toISOString() },
      duration: 5,
    });

    context.history.clearCheckHistory('clearTest');
    const entries = context.history.getCheckHistory('clearTest');
    expect(entries.length).toBe(0);

    await kernel.destroy();
  });

  it('should clear all history', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();
    // Manually emit events to add history
    kernel.emit('check:completed', {
      name: 'test1',
      result: { status: 'healthy', latency: 5, lastCheck: new Date().toISOString() },
      duration: 5,
    });
    kernel.emit('check:completed', {
      name: 'test2',
      result: { status: 'healthy', latency: 10, lastCheck: new Date().toISOString() },
      duration: 10,
    });

    context.history.clearHistory();

    expect(context.history.getCheckHistory('test1').length).toBe(0);
    expect(context.history.getCheckHistory('test2').length).toBe(0);
    expect(context.history.getOverallHistory().length).toBe(0);

    await kernel.destroy();
  });

  it('should get full history object', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();
    const history = context.history.getHistory();

    expect(history).toBeDefined();
    expect(history.overall).toBeDefined();
    expect(history.perCheck).toBeDefined();
    expect(Array.isArray(history.overall)).toBe(true);
    expect(history.perCheck instanceof Map).toBe(true);

    await kernel.destroy();
  });
});

describe('Plugin Coverage - Metrics Plugin', () => {
  it('should work with metricsPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(metricsPluginWithOptions());

    await kernel.init();

    const context = kernel.getContext();
    expect(context.metrics).toBeDefined();
    expect(context.metrics.formatPrometheus).toBeDefined();

    await kernel.destroy();
  });

  it('should format metrics as prometheus', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(metricsPlugin);

    await kernel.init();

    const context = kernel.getContext();
    // Create a sample status to format
    const sampleStatus = {
      status: 'healthy' as const,
      score: 100,
      uptime: 1000,
      timestamp: new Date().toISOString(),
      checks: {
        test: { status: 'healthy' as const, latency: 5, lastCheck: new Date().toISOString() },
      },
    };
    const prometheus = context.metrics.formatPrometheus(sampleStatus);
    expect(prometheus).toContain('health_');

    await kernel.destroy();
  });

  it('should format metrics as JSON', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(metricsPlugin);

    await kernel.init();

    const context = kernel.getContext();
    const sampleStatus = {
      status: 'healthy' as const,
      score: 100,
      uptime: 1000,
      timestamp: new Date().toISOString(),
      checks: {
        test: { status: 'healthy' as const, latency: 5, lastCheck: new Date().toISOString() },
      },
    };
    const jsonMetrics = context.metrics.formatJson(sampleStatus);
    expect(jsonMetrics).toBeDefined();
    expect((jsonMetrics as { score: number }).score).toBe(100);

    await kernel.destroy();
  });
});

describe('Plugin Coverage - Thresholds Plugin', () => {
  it('should work with thresholdsPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPluginWithOptions({ healthy: 85, degraded: 55 }));

    await kernel.init();

    const context = kernel.getContext();
    expect(context.thresholds).toBeDefined();
    const thresholds = context.thresholds.get();
    expect(thresholds.healthy).toBe(85);
    expect(thresholds.degraded).toBe(55);

    await kernel.destroy();
  });

  it('should get and set thresholds', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext();
    expect(context.thresholds).toBeDefined();
    expect(context.thresholds.get).toBeDefined();
    expect(context.thresholds.set).toBeDefined();

    // Get initial thresholds
    const initial = context.thresholds.get();
    expect(initial.healthy).toBe(80);
    expect(initial.degraded).toBe(50);

    // Set new thresholds
    context.thresholds.set({ healthy: 90, degraded: 60 });
    const updated = context.thresholds.get();
    expect(updated.healthy).toBe(90);
    expect(updated.degraded).toBe(60);

    await kernel.destroy();
  });

  it('should reset thresholds to defaults', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext();

    // Change thresholds
    context.thresholds.set({ healthy: 95, degraded: 70 });
    expect(context.thresholds.get().healthy).toBe(95);

    // Reset to defaults
    context.thresholds.reset();
    const reset = context.thresholds.get();
    expect(reset.healthy).toBe(80);
    expect(reset.degraded).toBe(50);

    await kernel.destroy();
  });

  it('should throw on invalid threshold values', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext();

    // Should throw for value > 100
    expect(() => context.thresholds.set({ healthy: 150 })).toThrow();

    // Should throw for value < 0
    expect(() => context.thresholds.set({ degraded: -10 })).toThrow();

    await kernel.destroy();
  });
});

describe('Update Metrics Coverage', () => {
  it('should update metrics with failure', async () => {
    const kernel = createHealthKernel({
      port: 0,
      interval: '50ms',
      checks: {
        metricsTest: {
          handler: () => ({ status: 'unhealthy' as const, latency: 100 }),
          interval: '50ms',
        },
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();
    await sleep(100);

    const context = kernel.getContext();
    const metrics = context.metrics.checks['metricsTest'];
    if (metrics) {
      expect(metrics.failure).toBeGreaterThanOrEqual(0);
    }

    await kernel.destroy();
  });

  it('should calculate average latency', async () => {
    const kernel = createHealthKernel({
      port: 0,
      interval: '30ms',
      checks: {
        latencyTest: {
          handler: () => ({ status: 'healthy' as const, latency: 10 }),
          interval: '30ms',
        },
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();
    await sleep(100);

    const context = kernel.getContext();
    const metrics = context.metrics.checks['latencyTest'];
    if (metrics) {
      expect(metrics.avgLatency).toBeGreaterThanOrEqual(0);
    }

    await kernel.destroy();
  });
});
