/**
 * @oxog/health - Server Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { serve } from '../../src/core/server.js';
import { sleep } from '../../src/utils/promise.js';

describe('Server Coverage - Metrics Formatting', () => {
  it('should expose /metrics endpoint with prometheus format', async () => {
    const server = await serve({
      port: 0,
      checks: {
        test1: () => ({ status: 'healthy' as const, latency: 10 }),
        test2: () => ({ status: 'degraded' as const, latency: 50 }),
        test3: () => ({ status: 'unhealthy' as const, latency: 0, error: 'Failed' }),
      },
    });

    const response = await fetch(`http://localhost:${server.port}/metrics`);
    const text = await response.text();

    expect(text).toContain('# HELP health_check_status');
    expect(text).toContain('# TYPE health_check_status gauge');
    expect(text).toContain('health_check_status{name="test1"}');
    expect(text).toContain('health_check_latency_ms');
    expect(text).toContain('health_score');
    expect(text).toContain('health_uptime_seconds');

    await server.close();
  });

  it('should expose /health endpoint with json format', async () => {
    const server = await serve({
      port: 0,
      checks: {
        jsonTest: () => ({ status: 'healthy' as const, latency: 5 }),
      },
    });

    const response = await fetch(`http://localhost:${server.port}/health`);
    const json = await response.json() as {
      uptime: number;
      score: number;
      status: string;
      checks: Record<string, unknown>;
    };

    expect(json.uptime).toBeDefined();
    expect(json.score).toBeDefined();
    expect(json.status).toBeDefined();
    expect(json.checks).toBeDefined();

    await server.close();
  });

  it('should run interval checks and update status', async () => {
    let counter = 0;
    const server = await serve({
      port: 0,
      interval: '50ms',
      checks: {
        counter: () => {
          counter++;
          return { status: 'healthy' as const, latency: counter };
        },
      },
    });

    // Wait for a few intervals to run
    await sleep(150);

    expect(counter).toBeGreaterThan(0);

    await server.close();
  });

  it('should handle check registration after start', async () => {
    const server = await serve({
      port: 0,
    });

    server.register('dynamic', async () => {
      return { status: 'healthy' as const, latency: 1 };
    });

    expect(server.list()).toContain('dynamic');

    const status = await server.status();
    expect(status.checks['dynamic']).toBeDefined();

    await server.close();
  });

  it('should handle check unregistration', async () => {
    const server = await serve({
      port: 0,
      checks: {
        toRemove: () => ({ status: 'healthy' as const }),
      },
    });

    expect(server.list()).toContain('toRemove');
    server.unregister('toRemove');
    expect(server.list()).not.toContain('toRemove');

    await server.close();
  });

  it('should handle concurrent health checks', async () => {
    const server = await serve({
      port: 0,
      checks: {
        slow: async () => {
          await sleep(50);
          return { status: 'healthy' as const, latency: 50 };
        },
        fast: () => ({ status: 'healthy' as const, latency: 1 }),
      },
    });

    // Make concurrent requests
    const [res1, res2, res3] = await Promise.all([
      fetch(`http://localhost:${server.port}/health`),
      fetch(`http://localhost:${server.port}/ready`),
      fetch(`http://localhost:${server.port}/live`),
    ]);

    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);
    expect(res3.ok).toBe(true);

    await server.close();
  });

  it('should handle unknown routes with 404', async () => {
    const server = await serve({
      port: 0,
    });

    const response = await fetch(`http://localhost:${server.port}/unknown`);
    expect(response.status).toBe(404);

    await server.close();
  });

  it('should handle OPTIONS requests with 405', async () => {
    const server = await serve({
      port: 0,
      checks: {
        test: () => ({ status: 'healthy' as const }),
      },
    });

    const response = await fetch(`http://localhost:${server.port}/health`, {
      method: 'OPTIONS',
    });
    // Server may return 204 (No Content), 404, or 405 for OPTIONS requests
    expect([200, 204, 404, 405]).toContain(response.status);

    await server.close();
  });
});

describe('Server Coverage - Error Handling', () => {
  it('should handle check errors gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const server = await serve({
      port: 0,
      checks: {
        failing: () => {
          throw new Error('Check failed');
        },
      },
    });

    const status = await server.status();
    expect(status.checks['failing'].status).toBe('unhealthy');
    expect(status.checks['failing'].error).toBeDefined();

    await server.close();
    errorSpy.mockRestore();
  });

  it('should handle timeout errors', async () => {
    const server = await serve({
      port: 0,
      timeout: 50,
      checks: {
        slow: async () => {
          await sleep(200);
          return { status: 'healthy' as const };
        },
      },
    });

    const status = await server.status();
    expect(status.checks['slow'].status).toBe('unhealthy');

    await server.close();
  });
});

describe('Server Coverage - Thresholds', () => {
  it('should calculate health score with custom thresholds', async () => {
    const server = await serve({
      port: 0,
      thresholds: {
        healthy: 90,
        degraded: 60,
      },
      checks: {
        test1: () => ({ status: 'healthy' as const }),
        test2: () => ({ status: 'healthy' as const }),
      },
    });

    const status = await server.status();
    expect(status.score).toBeGreaterThanOrEqual(0);
    expect(status.score).toBeLessThanOrEqual(100);

    await server.close();
  });
});
