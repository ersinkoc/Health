/**
 * @oxog/health - Full Coverage Tests
 * Tests designed to achieve 100% code coverage
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
import { Router } from '../../src/core/router.js';

describe('Server Metrics Full Coverage', () => {
  let server: HealthServer;

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('status with multiple checks', () => {
    it('should return status with healthy, degraded, and unhealthy checks', async () => {
      server = createServer({ port: 0 });
      server.register('healthy-check', async () => ({ status: 'healthy' as const, latency: 5 }));
      server.register('degraded-check', async () => ({ status: 'degraded' as const, latency: 100, error: 'slow' }));
      server.register('unhealthy-check', async () => ({ status: 'unhealthy' as const, latency: 0, error: 'down' }));

      await server.start();
      const status = await server.status();

      expect(status.checks['healthy-check']).toBeDefined();
      expect(status.checks['degraded-check']).toBeDefined();
      expect(status.checks['unhealthy-check']).toBeDefined();
      expect(status.checks['healthy-check'].status).toBe('healthy');
      expect(status.checks['degraded-check'].status).toBe('degraded');
      expect(status.checks['unhealthy-check'].status).toBe('unhealthy');
    });

    it('should return high score with mostly healthy checks', async () => {
      server = createServer({ port: 0 });
      server.register('db', async () => ({ status: 'healthy' as const, latency: 5 }));
      server.register('cache', async () => ({ status: 'healthy' as const, latency: 1 }));
      server.register('api', async () => ({ status: 'healthy' as const, latency: 10 }));

      await server.start();
      const status = await server.status();

      expect(status.score).toBeGreaterThanOrEqual(90);
      expect(status.status).toBe('healthy');
    });

    it('should include uptime and timestamp', async () => {
      server = createServer({ port: 0 });

      await server.start();
      const status = await server.status();

      expect(status.uptime).toBeGreaterThanOrEqual(0);
      expect(status.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should include lastCheck timestamp for each check', async () => {
      server = createServer({ port: 0 });
      server.register('test', async () => ({ status: 'healthy' as const, latency: 5 }));

      await server.start();
      const status = await server.status();

      expect(status.checks.test.lastCheck).toBeDefined();
      expect(status.checks.test.lastCheck).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('server lifecycle edge cases', () => {
    it('should handle close when not started', async () => {
      server = createServer({ port: 0 });
      // Close without starting should not throw
      await server.close();
    });

    it('should handle multiple registrations of same check', async () => {
      server = createServer({ port: 0 });
      server.register('test', async () => ({ status: 'healthy' as const }));
      // Re-register should update the check
      server.register('test', async () => ({ status: 'healthy' as const }));

      await server.start();
      const status = await server.status();

      expect(status.checks.test).toBeDefined();
    });
  });
});

describe('Router Full Coverage', () => {
  describe('normalizePath edge cases', () => {
    it('should remove trailing slashes', () => {
      const router = new Router('/');
      const normalized = (router as any).normalizePath('/users/');
      expect(normalized).toBe('/users');
    });

    it('should ensure leading slash', () => {
      const router = new Router('/');
      const normalized = (router as any).normalizePath('users');
      expect(normalized).toBe('/users');
    });

    it('should handle root path', () => {
      const router = new Router('/');
      const normalized = (router as any).normalizePath('/');
      expect(normalized).toBe('/');
    });

    it('should handle path without leading slash', () => {
      const router = new Router('/');
      const normalized = (router as any).normalizePath('api/users');
      expect(normalized).toBe('/api/users');
    });

    it('should handle path with trailing slash and leading slash', () => {
      const router = new Router('/');
      const normalized = (router as any).normalizePath('/users/');
      expect(normalized).toBe('/users');
    });

    it('should handle empty path', () => {
      const router = new Router('/');
      const normalized = (router as any).normalizePath('');
      expect(normalized).toBe('/');
    });
  });

  describe('pathToRegex edge cases', () => {
    it('should handle path with no parameters', () => {
      const router = new Router('/');
      const regex = (router as any).pathToRegex('/health');
      expect(regex.test('/health')).toBe(true);
      expect(regex.test('/health/')).toBe(false);
    });

    it('should handle path with wildcard', () => {
      const router = new Router('/');
      const regex = (router as any).pathToRegex('/api/*');
      expect(regex.test('/api/users')).toBe(true);
      expect(regex.test('/api/users/123')).toBe(true);
      expect(regex.test('/api/')).toBe(true);
    });

    it('should handle path with multiple parameters', () => {
      const router = new Router('/');
      const regex = (router as any).pathToRegex('/users/:id/posts/:postId');
      const match = regex.exec('/users/123/posts/456');
      expect(match).not.toBeNull();
      expect(match?.groups?.id).toBe('123');
      expect(match?.groups?.postId).toBe('456');
    });

    it('should handle path with special regex characters', () => {
      const router = new Router('/');
      const regex = (router as any).pathToRegex('/health.check');
      expect(regex.test('/health.check')).toBe(true);
    });

    it('should handle path with dots', () => {
      const router = new Router('/');
      const regex = (router as any).pathToRegex('/file.txt');
      expect(regex.test('/file.txt')).toBe(true);
    });

    it('should handle path with plus sign', () => {
      const router = new Router('/');
      const regex = (router as any).pathToRegex('/api/v1+2');
      expect(regex.test('/api/v1+2')).toBe(true);
    });
  });
});

describe('Runner Full Coverage', () => {
  it('should run checks with different intervals', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    // Set checks with different intervals
    context.checks.set('fast-check', { check: async () => ({ status: 'healthy' as const }), interval: '5s' });
    context.checks.set('slow-check', { check: async () => ({ status: 'healthy' as const }), interval: '10s' });

    await kernel.init();
    await kernel.destroy();
  });

  it('should handle check with custom weight', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('weighted', {
      check: async () => ({ status: 'healthy' as const, latency: 5 }),
      weight: 75,
    });

    await kernel.init();
    kernel.destroy();
  });

  it('should handle check with critical flag', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('critical', {
      check: async () => ({ status: 'unhealthy' as const, latency: 0, error: 'fail' }),
      critical: true,
    });

    await kernel.init();
    kernel.destroy();
  });

  it('should handle check with all optional fields', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('full-check', {
      check: async () => ({ status: 'healthy' as const, latency: 5 }),
      interval: '30s',
      weight: 60,
      timeout: '5s',
    });

    await kernel.init();
    kernel.destroy();
  });

  it('should handle check with timeout', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('slow', {
      check: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { status: 'healthy' as const };
      },
      timeout: '200ms',
    });

    await kernel.init();
    kernel.destroy();
  });

  it('should handle empty checks map', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    // Ensure checks is empty
    context.checks.clear();

    await kernel.init();
    kernel.destroy();
  });
});

describe('Thresholds Full Coverage', () => {
  it('should validate threshold values', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    // Test setting invalid thresholds
    let error: Error | null = null;
    try {
      context.thresholds.set({ healthy: 110 }); // Invalid - over 100
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();
    expect(error?.message).toContain('healthy');

    error = null;
    try {
      context.thresholds.set({ degraded: -10 }); // Invalid - negative
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();
    expect(error?.message).toContain('degraded');

    kernel.destroy();
  });

  it('should validate NaN threshold', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    let error: Error | null = null;
    try {
      context.thresholds.set({ healthy: NaN });
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();

    kernel.destroy();
  });

  it('should handle partial threshold updates', async () => {
    const kernel = createHealthKernel({ port: 0, thresholds: { healthy: 80, degraded: 50 } });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    // Update only healthy threshold
    context.thresholds.set({ healthy: 90 });
    const current = context.thresholds.get();

    expect(current.healthy).toBe(90);
    expect(current.degraded).toBe(50); // Should remain unchanged

    kernel.destroy();
  });
});

describe('History Full Coverage', () => {
  it('should handle history with multiple checks', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    // Simulate history entries for multiple checks
    for (let i = 0; i < 3; i++) {
      kernel.emit('check:completed', {
        name: 'check1',
        result: { status: 'healthy' as const, latency: 5 },
        duration: 10,
      });
      kernel.emit('check:completed', {
        name: 'check2',
        result: { status: 'healthy' as const, latency: 3 },
        duration: 8,
      });
    }

    const history = context.history.getHistory();
    expect(history.overall.length).toBeGreaterThan(0);
    expect(history.perCheck.size).toBeGreaterThan(0);

    kernel.destroy();
  });

  it('should get trends for check with history', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    // Add history
    kernel.emit('check:completed', {
      name: 'test',
      result: { status: 'healthy' as const, latency: 5 },
      duration: 10,
    });

    const trends = context.history.getTrends('test');
    expect(trends).toBeDefined();

    kernel.destroy();
  });

  it('should get trends for non-existent check', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    const trends = context.history.getTrends('non-existent');

    expect(trends).toBeDefined();

    kernel.destroy();
  });

  it('should clear history', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    // Add some history
    kernel.emit('check:completed', {
      name: 'test',
      result: { status: 'healthy' as const, latency: 5 },
      duration: 10,
    });

    // Clear history
    context.history.clearHistory();

    const history = context.history.getHistory();
    expect(history.overall.length).toBe(0);

    kernel.destroy();
  });
});

describe('Metrics Full Coverage', () => {
  it('should format JSON metrics', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(metricsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    // Create a mock status object
    const mockStatus = {
      status: 'healthy' as const,
      score: 100,
      uptime: 3600,
      timestamp: new Date().toISOString(),
      checks: {
        test: { status: 'healthy' as const, latency: 5, lastCheck: new Date().toISOString() },
      },
    };

    const jsonMetrics = context.metrics.formatJson(mockStatus);

    expect(jsonMetrics).toBeDefined();
    expect(jsonMetrics.uptime).toBe(3600);
    expect(jsonMetrics.score).toBe(100);
    expect(jsonMetrics.status).toBe('healthy');
    expect(jsonMetrics.checks).toBeDefined();

    kernel.destroy();
  });

  it('should format prometheus metrics with all check types', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(metricsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    const mockStatus = {
      status: 'degraded' as const,
      score: 60,
      uptime: 100,
      timestamp: new Date().toISOString(),
      checks: {
        healthy: { status: 'healthy' as const, latency: 5, lastCheck: new Date().toISOString() },
        degraded: { status: 'degraded' as const, latency: 150, lastCheck: new Date().toISOString() },
        unhealthy: { status: 'unhealthy' as const, latency: 0, lastCheck: new Date().toISOString() },
      },
    };

    const prometheusMetrics = context.metrics.formatPrometheus(mockStatus);

    expect(prometheusMetrics).toContain('health_check_status{name="healthy"} 1');
    expect(prometheusMetrics).toContain('health_check_status{name="degraded"} 0.5');
    expect(prometheusMetrics).toContain('health_check_status{name="unhealthy"} 0');
    expect(prometheusMetrics).toContain('health_score 60');
    expect(prometheusMetrics).toContain('health_uptime_seconds 100');

    kernel.destroy();
  });
});

describe('Kernel Full Coverage', () => {
  it('should handle multiple init/destroy cycles', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();
    kernel.destroy();

    // Re-init should work
    await kernel.init();
    kernel.destroy();
  });

  it('should have correct context properties', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext();
    expect(context.options).toBeDefined();
    expect(context.events).toBeDefined();
    expect(context.logger).toBeDefined();

    kernel.destroy();
  });

  it('should handle plugin with install only', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    kernel.use({
      name: 'install-only',
      version: '1.0.0',
      install() {
        // Just install, no init/destroy hooks
      },
    });

    await kernel.init();
    kernel.destroy();
  });
});

describe('Errors Full Coverage', () => {
  it('should create HealthError with all properties', async () => {
    const { HealthError, ERROR_CODES } = await import('../../src/errors.js');

    const error = new HealthError('Test message', ERROR_CODES.INVALID_CONFIG, { field: 'value' });
    expect(error.code).toBe('INVALID_CONFIG');
    expect(error.message).toBe('Test message');
    expect(error.details).toEqual({ field: 'value' });
    expect(error.toJSON()).toEqual({
      name: 'HealthError',
      code: 'INVALID_CONFIG',
      message: 'Test message',
      details: { field: 'value' },
    });
  });

  it('should create error from static method', async () => {
    const { HealthError, ERROR_CODES } = await import('../../src/errors.js');

    const json = { message: 'Test error', code: ERROR_CODES.CHECK_TIMEOUT, details: { check: 'db' } };
    const error = HealthError.fromJSON(json);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('CHECK_TIMEOUT');
  });

  it('should format error to JSON', async () => {
    const { HealthError, ERROR_CODES } = await import('../../src/errors.js');

    const error = new HealthError('Resource not found', ERROR_CODES.INVALID_ARGUMENT);
    const json = error.toJSON();
    expect(json.name).toBe('HealthError');
    expect(json.code).toBe('INVALID_ARGUMENT');
  });
});
