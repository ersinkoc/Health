/**
 * @oxog/health - Complete Coverage Tests
 * Tests designed to achieve 100% code coverage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../../src/core/router.js';
import { serve, createServer } from '../../src/core/server.js';
import type { HealthServer } from '../../src/types.js';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';
import { thresholdsPlugin } from '../../src/plugins/optional/thresholds.js';
import { metricsPlugin } from '../../src/plugins/optional/metrics.js';
import { historyPlugin } from '../../src/plugins/optional/history.js';

describe('Router Complete Coverage', () => {
  describe('HTTP method handlers', () => {
    it('should register GET route', () => {
      const router = new Router();
      router.get('/test', () => {});
      expect(router.getRoutesForMethod('GET')).toHaveLength(1);
    });

    it('should register POST route', () => {
      const router = new Router();
      router.post('/test', () => {});
      expect(router.getRoutesForMethod('POST')).toHaveLength(1);
    });

    it('should register PUT route', () => {
      const router = new Router();
      router.put('/test', () => {});
      expect(router.getRoutesForMethod('PUT')).toHaveLength(1);
    });

    it('should register PATCH route', () => {
      const router = new Router();
      router.patch('/test', () => {});
      expect(router.getRoutesForMethod('PATCH')).toHaveLength(1);
    });

    it('should register DELETE route', () => {
      const router = new Router();
      router.delete('/test', () => {});
      expect(router.getRoutesForMethod('DELETE')).toHaveLength(1);
    });

    it('should register HEAD route', () => {
      const router = new Router();
      router.head('/test', () => {});
      expect(router.getRoutesForMethod('HEAD')).toHaveLength(1);
    });

    it('should register OPTIONS route', () => {
      const router = new Router();
      router.options('/test', () => {});
      expect(router.getRoutesForMethod('OPTIONS')).toHaveLength(1);
    });

    it('should register all methods with all()', () => {
      const router = new Router();
      router.all('/test', () => {});
      expect(router.getRoutesForMethod('GET')).toHaveLength(1);
      expect(router.getRoutesForMethod('POST')).toHaveLength(1);
      expect(router.getRoutesForMethod('PUT')).toHaveLength(1);
      expect(router.getRoutesForMethod('PATCH')).toHaveLength(1);
      expect(router.getRoutesForMethod('DELETE')).toHaveLength(1);
      expect(router.getRoutesForMethod('HEAD')).toHaveLength(1);
      expect(router.getRoutesForMethod('OPTIONS')).toHaveLength(1);
    });

    it('should return this for method chaining', () => {
      const router = new Router();
      expect(router.get('/a', () => {})).toBe(router);
      expect(router.post('/b', () => {})).toBe(router);
      expect(router.put('/c', () => {})).toBe(router);
      expect(router.patch('/d', () => {})).toBe(router);
      expect(router.delete('/e', () => {})).toBe(router);
      expect(router.head('/f', () => {})).toBe(router);
      expect(router.options('/g', () => {})).toBe(router);
    });
  });

  describe('addRoute', () => {
    it('should normalize path when adding route', () => {
      const router = new Router({ basePath: '/api' });
      router.get('users', () => {});
      const routes = router.getRoutes();
      expect(routes[0].path).toBe('/api/users');
    });

    it('should convert method to uppercase', () => {
      const router = new Router();
      router.get('/test', () => {});
      const routes = router.getRoutesForMethod('GET');
      expect(routes).toHaveLength(1);
    });
  });

  describe('middleware', () => {
    it('should register middleware', () => {
      const router = new Router();
      const mw = () => {};
      router.use(mw);
      expect((router as any).middleware).toHaveLength(1);
    });

    it('should return this for use', () => {
      const router = new Router();
      expect(router.use(() => {})).toBe(router);
    });
  });

  describe('match', () => {
    it('should return null for unregistered method', () => {
      const router = new Router();
      router.get('/test', () => {});
      const match = router.match('POST', '/test');
      expect(match).toBeNull();
    });

    it('should return null for unregistered path', () => {
      const router = new Router();
      router.get('/test', () => {});
      const match = router.match('GET', '/other');
      expect(match).toBeNull();
    });

    it('should match route with params', () => {
      const router = new Router();
      router.get('/users/:id', () => {});
      const match = router.match('GET', '/users/123');
      expect(match).not.toBeNull();
      expect(match?.params.id).toBe('123');
    });

    it('should match route with multiple params', () => {
      const router = new Router();
      router.get('/users/:userId/posts/:postId', () => {});
      const match = router.match('GET', '/users/1/posts/2');
      expect(match).not.toBeNull();
      expect(match?.params.userId).toBe('1');
      expect(match?.params.postId).toBe('2');
    });

    it('should match route with wildcard', () => {
      const router = new Router();
      router.get('/api/*', () => {});
      const match = router.match('GET', '/api/v1/users');
      expect(match).not.toBeNull();
    });
  });

  describe('matchAny', () => {
    it('should match route for any method', () => {
      const router = new Router();
      router.get('/test', () => {});
      const match = router.matchAny('/test');
      expect(match).not.toBeNull();
    });

    it('should return null for unregistered path', () => {
      const router = new Router();
      router.get('/test', () => {});
      const match = router.matchAny('/other');
      expect(match).toBeNull();
    });

    it('should match first route found across methods', () => {
      const router = new Router();
      router.get('/test', () => {});
      router.post('/test', () => {});
      const match = router.matchAny('/test');
      expect(match).not.toBeNull();
    });
  });

  describe('getRoutes', () => {
    it('should return all routes', () => {
      const router = new Router();
      router.get('/a', () => {});
      router.post('/b', () => {});
      router.put('/c', () => {});
      const routes = router.getRoutes();
      expect(routes).toHaveLength(3);
    });

    it('should return empty array when no routes', () => {
      const router = new Router();
      const routes = router.getRoutes();
      expect(routes).toHaveLength(0);
    });
  });

  describe('getRoutesForMethod', () => {
    it('should return routes for specific method', () => {
      const router = new Router();
      router.get('/a', () => {});
      router.get('/b', () => {});
      const routes = router.getRoutesForMethod('GET');
      expect(routes).toHaveLength(2);
    });

    it('should return empty array for unregistered method', () => {
      const router = new Router();
      router.get('/test', () => {});
      const routes = router.getRoutesForMethod('POST');
      expect(routes).toHaveLength(0);
    });
  });

  describe('removeRoute', () => {
    it('should remove existing route', () => {
      const router = new Router();
      router.get('/test', () => {});
      expect(router.getRoutesForMethod('GET')).toHaveLength(1);
      const removed = router.removeRoute('GET', '/test');
      expect(removed).toBe(true);
      expect(router.getRoutesForMethod('GET')).toHaveLength(0);
    });

    it('should return false for unregistered method', () => {
      const router = new Router();
      const removed = router.removeRoute('POST', '/test');
      expect(removed).toBe(false);
    });

    it('should return false for unregistered path', () => {
      const router = new Router();
      router.get('/test', () => {});
      const removed = router.removeRoute('GET', '/other');
      expect(removed).toBe(false);
    });
  });
});

describe('Server Complete Coverage', () => {
  let server: HealthServer;

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('createServer options', () => {
    it('should create server with all options', () => {
      server = createServer({
        port: 0,
        host: '127.0.0.1',
        basePath: '/health',
        interval: '30s',
        timeout: '5s',
        thresholds: { healthy: 90, degraded: 60 },
      });
      expect(server).toBeDefined();
    });

    it('should create server with minimal options', () => {
      server = createServer({ port: 0 });
      expect(server).toBeDefined();
    });
  });

  describe('serve function', () => {
    it('should start server and return port', async () => {
      server = await serve({ port: 0 });
      expect(server.port).toBeGreaterThan(0);
    });
  });

  describe('register edge cases', () => {
    it('should unregister check and return true', async () => {
      server = createServer({ port: 0 });
      server.register('test', async () => ({ status: 'healthy' }));
      const removed = server.unregister('test');
      expect(removed).toBe(true);
      expect(server.list()).not.toContain('test');
    });

    it('should return false when unregistering non-existent', async () => {
      server = createServer({ port: 0 });
      const removed = server.unregister('non-existent');
      expect(removed).toBe(false);
    });

    it('should list all registered checks', async () => {
      server = createServer({ port: 0 });
      server.register('check1', async () => ({ status: 'healthy' }));
      server.register('check2', async () => ({ status: 'healthy' }));
      const checks = server.list();
      expect(checks).toContain('check1');
      expect(checks).toContain('check2');
    });
  });

  describe('status with different check results', () => {
    it('should show healthy status with all healthy checks', async () => {
      server = createServer({ port: 0 });
      server.register('db', async () => ({ status: 'healthy', latency: 5 }));
      server.register('cache', async () => ({ status: 'healthy', latency: 1 }));
      await server.start();
      const status = await server.status();
      expect(status.status).toBe('healthy');
      expect(status.score).toBe(100);
    });

    it('should show degraded status with some degraded checks', async () => {
      server = createServer({ port: 0 });
      server.register('db', async () => ({ status: 'healthy', latency: 5 }));
      server.register('slow', async () => ({ status: 'degraded', latency: 500, error: 'slow' }));
      await server.start();
      const status = await server.status();
      expect(status.status).toBe('degraded');
    });

    it('should show unhealthy status with critical failure', async () => {
      server = createServer({ port: 0 });
      server.register('db', async () => ({ status: 'healthy', latency: 5 }));
      server.register('critical', {
        handler: async () => ({ status: 'unhealthy', latency: 0, error: 'down' }),
        critical: true,
      });
      await server.start();
      const status = await server.status();
      expect(status.status).toBe('unhealthy');
    });

    it('should include latency in check results', async () => {
      server = createServer({ port: 0 });
      server.register('test', async () => ({ status: 'healthy', latency: 42 }));
      await server.start();
      const status = await server.status();
      expect(status.checks.test.latency).toBe(42);
    });

    it('should include error message in failed checks', async () => {
      server = createServer({ port: 0 });
      server.register('test', async () => ({ status: 'unhealthy', latency: 0, error: 'Connection refused' }));
      await server.start();
      const status = await server.status();
      expect(status.checks.test.error).toBe('Connection refused');
    });
  });
});

describe('Runner Plugin Complete Coverage', () => {
  it('should run checks with interval parsed from string', async () => {
    const kernel = createHealthKernel({ port: 0, interval: '10s' });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('test', {
      check: async () => ({ status: 'healthy' as const }),
      interval: '5s',
    });

    await kernel.destroy();
  });

  it('should run checks with timeout parsed from string', async () => {
    const kernel = createHealthKernel({ port: 0, timeout: '5s' });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('test', {
      check: async () => ({ status: 'healthy' as const }),
      timeout: '3s',
    });

    await kernel.destroy();
  });

  it('should handle check with weight', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('test', {
      check: async () => ({ status: 'healthy' as const, latency: 5 }),
      weight: 100,
    });

    await kernel.destroy();
  });

  it('should handle check with critical flag', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('test', {
      check: async () => ({ status: 'unhealthy' as const, error: 'fail' }),
      critical: true,
    });

    await kernel.destroy();
  });
});

describe('Aggregator Plugin Complete Coverage', () => {
  it('should calculate score with mixed weights', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    // Manually test the aggregator
    const results = new Map([
      ['high-priority', { status: 'healthy' as const, latency: 5, weight: 80 }],
      ['low-priority', { status: 'healthy' as const, latency: 5, weight: 20 }],
    ]);

    // Access aggregator via context
    const status = context.aggregator.aggregate(results, 100);
    expect(status.score).toBe(100);

    kernel.destroy();
  });

  it('should handle single check with weight 100', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    const results = new Map([
      ['only', { status: 'healthy' as const, latency: 5, weight: 100 }],
    ]);

    const status = context.aggregator.aggregate(results, 100);
    expect(status.score).toBe(100);
    expect(status.status).toBe('healthy');

    kernel.destroy();
  });

  it('should handle unhealthy critical check', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    const results = new Map([
      ['critical', { status: 'unhealthy' as const, latency: 0, critical: true, weight: 10 }],
      ['other', { status: 'healthy' as const, latency: 5, weight: 90 }],
    ]);

    const status = context.aggregator.aggregate(results, 100);
    expect(status.status).toBe('unhealthy');

    kernel.destroy();
  });
});

describe('History Plugin Complete Coverage', () => {
  it('should track multiple check results', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    // Simulate multiple check completions
    for (let i = 0; i < 5; i++) {
      kernel.emit('check:completed', {
        name: 'test-check',
        result: { status: 'healthy' as const, latency: i * 5 },
        duration: i * 10,
      });
    }

    const history = context.history.getHistory();
    expect(history.overall.length).toBe(5);

    const trends = context.history.getTrends('test-check');
    expect(trends).toBeDefined();

    kernel.destroy();
  });

  it('should track different checks separately', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

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

    const history = context.history.getHistory();
    expect(history.overall.length).toBe(2);
    expect(history.perCheck.size).toBe(2);
    expect(history.perCheck.get('check1')).toHaveLength(1);
    expect(history.perCheck.get('check2')).toHaveLength(1);

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

    kernel.emit('check:completed', {
      name: 'test',
      result: { status: 'healthy' as const, latency: 5 },
      duration: 10,
    });

    context.history.clearHistory();

    const history = context.history.getHistory();
    expect(history.overall.length).toBe(0);
    expect(history.perCheck.size).toBe(0);

    kernel.destroy();
  });
});

describe('Thresholds Plugin Complete Coverage', () => {
  it('should set and get thresholds', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    context.thresholds.set({ healthy: 85, degraded: 55 });
    const current = context.thresholds.get();

    expect(current.healthy).toBe(85);
    expect(current.degraded).toBe(55);

    kernel.destroy();
  });

  it('should throw for invalid healthy threshold', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    expect(() => context.thresholds.set({ healthy: 101 })).toThrow();
    expect(() => context.thresholds.set({ healthy: -1 })).toThrow();
    expect(() => context.thresholds.set({ healthy: NaN })).toThrow();

    kernel.destroy();
  });

  it('should throw for invalid degraded threshold', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    expect(() => context.thresholds.set({ degraded: 101 })).toThrow();
    expect(() => context.thresholds.set({ degraded: -5 })).toThrow();

    kernel.destroy();
  });

  it('should reset thresholds to defaults', async () => {
    const kernel = createHealthKernel({ port: 0, thresholds: { healthy: 90, degraded: 60 } });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(thresholdsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    context.thresholds.set({ healthy: 50, degraded: 30 });
    context.thresholds.reset();

    // reset() uses hardcoded DEFAULT values (80, 50), not kernel options
    const current = context.thresholds.get();
    expect(current.healthy).toBe(80);
    expect(current.degraded).toBe(50);

    kernel.destroy();
  });
});

describe('Metrics Plugin Complete Coverage', () => {
  it('should format JSON metrics', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(metricsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    const status = {
      status: 'healthy' as const,
      score: 100,
      uptime: 3600,
      timestamp: new Date().toISOString(),
      checks: {
        test: { status: 'healthy' as const, latency: 5, lastCheck: new Date().toISOString() },
      },
    };

    const json = context.metrics.formatJson(status);
    expect(json.uptime).toBe(3600);
    expect(json.score).toBe(100);
    expect(json.status).toBe('healthy');
    expect(json.checks).toBeDefined();

    kernel.destroy();
  });

  it('should format Prometheus metrics with all types', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(metricsPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;

    const status = {
      status: 'degraded' as const,
      score: 65,
      uptime: 7200,
      timestamp: new Date().toISOString(),
      checks: {
        healthy: { status: 'healthy' as const, latency: 5, lastCheck: new Date().toISOString() },
        degraded: { status: 'degraded' as const, latency: 150, lastCheck: new Date().toISOString() },
        unhealthy: { status: 'unhealthy' as const, latency: 0, lastCheck: new Date().toISOString() },
      },
    };

    const prom = context.metrics.formatPrometheus(status);

    // Check all metric types
    expect(prom).toContain('health_check_status{name="healthy"} 1');
    expect(prom).toContain('health_check_status{name="degraded"} 0.5');
    expect(prom).toContain('health_check_status{name="unhealthy"} 0');
    expect(prom).toContain('health_check_latency_ms{name="healthy"} 5');
    expect(prom).toContain('health_check_latency_ms{name="degraded"} 150');
    expect(prom).toContain('health_check_latency_ms{name="unhealthy"} 0');
    expect(prom).toContain('health_score 65');
    expect(prom).toContain('health_uptime_seconds 7200');

    kernel.destroy();
  });
});

describe('Kernel Complete Coverage', () => {
  it('should emit events', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    let eventReceived = false;
    kernel.on('test:event', () => {
      eventReceived = true;
    });

    kernel.emit('test:event', { data: 'test' });

    expect(eventReceived).toBe(true);

    await kernel.init();
    kernel.destroy();
  });

  it('should list registered plugins', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);

    const plugins = kernel.listPlugins();
    expect(plugins).toHaveLength(2);
    expect(plugins).toContain('http');
    expect(plugins).toContain('runner');

    await kernel.init();
    kernel.destroy();
  });

  it('should handle plugin with all lifecycle hooks', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    let installCalled = false;
    let initCalled = false;
    let destroyCalled = false;

    kernel.use({
      name: 'full-lifecycle',
      version: '1.0.0',
      dependencies: [],
      install() {
        installCalled = true;
      },
      onInit() {
        initCalled = true;
      },
      onDestroy() {
        destroyCalled = true;
      },
    });

    await kernel.init();

    expect(installCalled).toBe(true);
    expect(initCalled).toBe(true);

    kernel.destroy();

    expect(destroyCalled).toBe(true);
  });

  it('should handle getContext before init', () => {
    const kernel = createHealthKernel({ port: 0 });
    const context = kernel.getContext();
    expect(context).toBeDefined();
    expect(context.options).toBeDefined();
  });

  it('should handle destroy before init', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    // Destroy without init should not throw
    kernel.destroy();
  });

  it('should handle multiple destroy calls', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();
    kernel.destroy();
    kernel.destroy(); // Second destroy should not throw
  });
});
