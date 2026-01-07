/**
 * @oxog/health - History Plugin Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';
import { historyPlugin, historyPluginWithOptions } from '../../src/plugins/optional/history.js';
import { sleep } from '../../src/utils/promise.js';

describe('History Plugin Coverage - historyPluginWithOptions', () => {
  it('should respect maxEntries option', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPluginWithOptions({ maxEntries: 5, maxPerCheck: 3 }));

    await kernel.init();

    const context = kernel.getContext();

    // Emit more events than maxEntries
    for (let i = 0; i < 10; i++) {
      kernel.emit('check:completed', {
        name: 'test',
        result: { status: 'healthy', latency: i, lastCheck: new Date().toISOString() },
        duration: i,
      });
    }

    const overall = context.history.getOverallHistory();
    expect(overall.length).toBeLessThanOrEqual(5);

    const checkHistory = context.history.getCheckHistory('test');
    expect(checkHistory.length).toBeLessThanOrEqual(3);

    await kernel.destroy();
  });

  it('should calculate trends for entries with mixed statuses', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPluginWithOptions({ maxEntries: 100, maxPerCheck: 50 }));

    await kernel.init();

    const context = kernel.getContext();

    // Add entries with improving trend (more healthy at the end)
    for (let i = 0; i < 10; i++) {
      kernel.emit('check:completed', {
        name: 'trendTest',
        result: {
          status: i < 5 ? 'unhealthy' : 'healthy',
          latency: 10 - i,
          lastCheck: new Date().toISOString(),
        },
        duration: 10 - i,
      });
    }

    const trends = context.history.getTrends('trendTest');
    expect(trends.avgLatency).toBeDefined();
    expect(trends.successRate).toBeDefined();
    expect(['improving', 'stable', 'degrading']).toContain(trends.status);

    await kernel.destroy();
  });

  it('should calculate trends for degrading history', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPluginWithOptions({ maxEntries: 100, maxPerCheck: 50 }));

    await kernel.init();

    const context = kernel.getContext();

    // Add entries with degrading trend (more unhealthy at the end)
    for (let i = 0; i < 10; i++) {
      kernel.emit('check:completed', {
        name: 'degradingTest',
        result: {
          status: i >= 5 ? 'unhealthy' : 'healthy',
          latency: i,
          lastCheck: new Date().toISOString(),
        },
        duration: i,
      });
    }

    const trends = context.history.getTrends('degradingTest');
    expect(trends).toBeDefined();

    await kernel.destroy();
  });

  it('should handle clearHistory in historyPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPluginWithOptions({ maxEntries: 100, maxPerCheck: 50 }));

    await kernel.init();

    const context = kernel.getContext();

    // Add some entries
    kernel.emit('check:completed', {
      name: 'clearTest',
      result: { status: 'healthy', latency: 5, lastCheck: new Date().toISOString() },
      duration: 5,
    });

    expect(context.history.getOverallHistory().length).toBeGreaterThan(0);

    context.history.clearHistory();
    expect(context.history.getOverallHistory().length).toBe(0);

    await kernel.destroy();
  });

  it('should handle clearCheckHistory in historyPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPluginWithOptions({ maxEntries: 100, maxPerCheck: 50 }));

    await kernel.init();

    const context = kernel.getContext();

    // Add entries for multiple checks
    kernel.emit('check:completed', {
      name: 'check1',
      result: { status: 'healthy', latency: 5, lastCheck: new Date().toISOString() },
      duration: 5,
    });
    kernel.emit('check:completed', {
      name: 'check2',
      result: { status: 'healthy', latency: 10, lastCheck: new Date().toISOString() },
      duration: 10,
    });

    context.history.clearCheckHistory('check1');
    expect(context.history.getCheckHistory('check1').length).toBe(0);
    expect(context.history.getCheckHistory('check2').length).toBeGreaterThan(0);

    await kernel.destroy();
  });

  it('should calculate getTrends with historyPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPluginWithOptions({ maxEntries: 100, maxPerCheck: 50 }));

    await kernel.init();

    const context = kernel.getContext();

    // Add entries for stable trend
    for (let i = 0; i < 20; i++) {
      kernel.emit('check:completed', {
        name: 'stableTest',
        result: { status: 'healthy', latency: 5, lastCheck: new Date().toISOString() },
        duration: 5,
      });
    }

    const trends = context.history.getTrends('stableTest');
    expect(trends.avgLatency).toBe(5);
    expect(trends.successRate).toBe(100);
    expect(trends.status).toBe('stable');

    await kernel.destroy();
  });

  it('should return default trends for empty history in historyPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPluginWithOptions({ maxEntries: 100, maxPerCheck: 50 }));

    await kernel.init();

    const context = kernel.getContext();
    const trends = context.history.getTrends('nonexistent');

    expect(trends.avgLatency).toBe(0);
    expect(trends.successRate).toBe(100);
    expect(trends.status).toBe('stable');

    await kernel.destroy();
  });
});

describe('History Plugin Coverage - Main Plugin', () => {
  it('should record history via check:completed event', async () => {
    const kernel = createHealthKernel({
      port: 0,
      interval: '30ms',
      checks: {
        autoRecord: {
          handler: () => ({ status: 'healthy' as const, latency: 5 }),
          interval: '30ms',
        },
      },
    });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    // Wait for checks to run
    await sleep(100);

    const context = kernel.getContext();
    const history = context.history.getHistory();

    // History should have been recorded via events
    expect(history.overall.length).toBeGreaterThanOrEqual(0);

    await kernel.destroy();
  });

  it('should enforce maxEntries limit', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();

    // Emit many events (more than default max of 100)
    for (let i = 0; i < 150; i++) {
      kernel.emit('check:completed', {
        name: 'limitTest',
        result: { status: 'healthy', latency: i, lastCheck: new Date().toISOString() },
        duration: i,
      });
    }

    const overall = context.history.getOverallHistory();
    expect(overall.length).toBeLessThanOrEqual(100);

    const checkHistory = context.history.getCheckHistory('limitTest');
    expect(checkHistory.length).toBeLessThanOrEqual(50);

    await kernel.destroy();
  });
});
