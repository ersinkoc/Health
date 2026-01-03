/**
 * @oxog/health - Additional Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { serve, createServer } from '../../src/core/server.js';
import type { HealthServer } from '../../src/types.js';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';
import { thresholdsPlugin } from '../../src/plugins/optional/thresholds.js';
import { metricsPlugin } from '../../src/plugins/optional/metrics.js';
import { historyPlugin } from '../../src/plugins/optional/history.js';
import { parseInterval } from '../../src/core/interval-parser.js';

describe('Server Extended Integration', () => {
  let server: HealthServer;

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('server options', () => {
    it('should use default options', async () => {
      server = createServer({ port: 0 });
      expect(server).toBeDefined();
      await server.close();
    });

    it('should start with custom host', async () => {
      server = await serve({ port: 0, host: '127.0.0.1' });
      expect(server.port).toBeGreaterThan(0);
    });

    it('should support interval option', async () => {
      server = createServer({ port: 0, interval: '30s' });
      await server.start();
      await server.close();
    });
  });

  describe('check registration edge cases', () => {
    it('should handle check that throws error', async () => {
      server = createServer({ port: 0 });
      server.register('error-check', async () => {
        throw new Error('Check failed');
      });

      await server.start();
      const status = await server.status();
      await server.close();

      expect(status.checks['error-check']).toBeDefined();
      expect(status.checks['error-check'].error).toContain('Check failed');
    });

    it('should handle check returning degraded status', async () => {
      server = createServer({ port: 0 });
      server.register('degraded-check', async () => ({
        status: 'degraded' as const,
        latency: 100,
      }));

      await server.start();
      const status = await server.status();
      await server.close();

      expect(status.checks['degraded-check'].status).toBe('degraded');
    });

    it('should handle check returning unhealthy status', async () => {
      server = createServer({ port: 0 });
      server.register('unhealthy-check', async () => ({
        status: 'unhealthy' as const,
        latency: 0,
        error: 'Service down',
      }));

      await server.start();
      const status = await server.status();
      await server.close();

      expect(status.checks['unhealthy-check'].status).toBe('unhealthy');
    });

    it('should handle multiple checks with mixed statuses', async () => {
      server = createServer({ port: 0 });
      server.register('healthy', async () => ({ status: 'healthy' as const }));
      server.register('degraded', async () => ({ status: 'degraded' as const }));
      server.register('unhealthy', async () => ({ status: 'unhealthy' as const }));

      await server.start();
      const status = await server.status();
      await server.close();

      expect(status.checks.healthy).toBeDefined();
      expect(status.checks.degraded).toBeDefined();
      expect(status.checks.unhealthy).toBeDefined();
    });
  });

  describe('server lifecycle', () => {
    it('should not allow starting twice', async () => {
      server = createServer({ port: 0 });
      await server.start();

      let error: Error | null = null;
      try {
        await server.start();
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error?.message).toContain('already started');

      await server.close();
    });

    it('should handle multiple close calls', async () => {
      server = await serve({ port: 0 });
      await server.close();
      await server.close(); // Should not throw
    });
  });
});

describe('Kernel Extended Integration', () => {
  it('should initialize with all core plugins', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();
    expect(kernel).toBeDefined();

    kernel.destroy();
  });

  it('should emit events during lifecycle', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    let initCalled = false;
    let destroyCalled = false;

    kernel.use({
      name: 'test-lifecycle',
      version: '1.0.0',
      install() {},
      onInit() {
        initCalled = true;
      },
      onDestroy() {
        destroyCalled = true;
      },
    });

    await kernel.init();
    expect(initCalled).toBe(true);

    kernel.destroy();
    expect(destroyCalled).toBe(true);
  });
});

describe('Thresholds Integration', () => {
  it('should work with custom thresholds', async () => {
    const kernel = createHealthKernel({ port: 0, thresholds: { healthy: 90, degraded: 60 } });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    const thresholds = context.thresholds.get();
    expect(thresholds.healthy).toBe(90);
    expect(thresholds.degraded).toBe(60);

    kernel.destroy();
  });

  it('should update thresholds dynamically', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.thresholds.set({ healthy: 80, degraded: 50 });

    const thresholds = context.thresholds.get();
    expect(thresholds.healthy).toBe(80);
    expect(thresholds.degraded).toBe(50);

    kernel.destroy();
  });
});

describe('Metrics Integration', () => {
  it('should expose metrics format functions', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(metricsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    expect(context.metrics).toBeDefined();
    expect(typeof context.metrics.formatPrometheus).toBe('function');
    expect(typeof context.metrics.formatJson).toBe('function');

    kernel.destroy();
  });

  it('should format prometheus metrics', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(metricsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    // Create a mock status object since no checks are registered
    const mockStatus = {
      status: 'healthy',
      score: 100,
      uptime: 100,
      timestamp: new Date().toISOString(),
      checks: {
        test: { status: 'healthy', latency: 1, lastCheck: new Date().toISOString() },
      },
    };
    const prometheusMetrics = context.metrics.formatPrometheus(mockStatus);
    expect(prometheusMetrics).toContain('health_check_status');
    expect(prometheusMetrics).toContain('# HELP');

    kernel.destroy();
  });
});

describe('History Integration', () => {
  it('should track check history', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    expect(context.history).toBeDefined();
    expect(typeof context.history.getHistory).toBe('function');
    expect(typeof context.history.getTrends).toBe('function');

    const history = context.history.getHistory();
    expect(history).toBeDefined();
    expect(history.overall).toBeInstanceOf(Array);
    expect(history.perCheck).toBeInstanceOf(Map);

    kernel.destroy();
  });

  it('should return trends for checks', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    const trends = context.history.getTrends('test-check');
    expect(trends).toBeDefined();

    kernel.destroy();
  });
});

describe('Interval Parser Integration', () => {
  it('should parse various interval formats', () => {
    expect(parseInterval('5s')).toBe(5000);
    expect(parseInterval('1m')).toBe(60000);
    expect(parseInterval('1h')).toBe(3600000);
    expect(parseInterval('1d')).toBe(86400000);
    expect(parseInterval('500ms')).toBe(500);
    expect(parseInterval('10000')).toBe(10000);
  });

  it('should throw on invalid interval', () => {
    expect(() => parseInterval('invalid')).toThrow();
    expect(() => parseInterval('')).toThrow();
  });
});
