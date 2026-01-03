/**
 * @oxog/health - Runner Plugin Coverage Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { createServer } from '../../src/core/server.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';
import type { HealthServer } from '../../src/types.js';

describe('Runner Plugin Coverage', () => {
  let server: HealthServer;

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('check registration with options', () => {
    it('should register check with custom interval', async () => {
      server = createServer({ port: 0 });
      server.register('test', {
        handler: async () => ({ status: 'healthy' }),
        interval: '10s',
      });
      const checks = server.list();
      expect(checks).toContain('test');
    });

    it('should register check with custom timeout', async () => {
      server = createServer({ port: 0 });
      server.register('test', {
        handler: async () => ({ status: 'healthy' }),
        timeout: 5000,
      });
      const checks = server.list();
      expect(checks).toContain('test');
    });

    it('should register check with custom retries', async () => {
      server = createServer({ port: 0 });
      server.register('test', {
        handler: async () => ({ status: 'healthy' }),
        retries: 3,
      });
      const checks = server.list();
      expect(checks).toContain('test');
    });

    it('should register check with all options', async () => {
      server = createServer({ port: 0 });
      server.register('test', {
        handler: async () => ({ status: 'healthy' }),
        interval: '10s',
        timeout: 5000,
        retries: 3,
        weight: 75,
        critical: false,
      });
      const checks = server.list();
      expect(checks).toContain('test');
    });
  });

  describe('check execution edge cases', () => {
    it('should handle check that returns immediately', async () => {
      server = createServer({ port: 0 });
      server.register('fast', async () => ({ status: 'healthy', latency: 0 }));
      await server.start();
      const status = await server.status();
      expect(status.checks.fast).toBeDefined();
      expect(status.checks.fast.status).toBe('healthy');
    });

    it('should handle check with metadata', async () => {
      server = createServer({ port: 0 });
      server.register('test', async () => ({
        status: 'healthy' as const,
        latency: 5,
        metadata: { version: '1.0.0' },
      }));
      await server.start();
      const status = await server.status();
      expect(status.checks.test.metadata).toEqual({ version: '1.0.0' });
    });

    it('should handle multiple checks with different statuses', async () => {
      server = createServer({ port: 0 });
      server.register('healthy', async () => ({ status: 'healthy' as const }));
      server.register('degraded', async () => ({ status: 'degraded' as const, latency: 100 }));
      server.register('unhealthy', async () => ({ status: 'unhealthy' as const, error: 'down' }));

      await server.start();
      const status = await server.status();

      expect(status.checks.healthy).toBeDefined();
      expect(status.checks.degraded).toBeDefined();
      expect(status.checks.unhealthy).toBeDefined();
    });
  });

  describe('server status edge cases', () => {
    it('should return healthy when no checks registered', async () => {
      server = createServer({ port: 0 });
      await server.start();
      const status = await server.status();
      expect(status.status).toBe('healthy');
      expect(status.score).toBe(100);
    });

    it('should include timestamp in ISO format', async () => {
      server = createServer({ port: 0 });
      await server.start();
      const status = await server.status();
      expect(status.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include uptime in seconds', async () => {
      server = createServer({ port: 0 });
      await server.start();
      const status = await server.status();
      expect(typeof status.uptime).toBe('number');
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Kernel Runner Integration', () => {
  it('should run checks via kernel', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('test', {
      check: async () => ({ status: 'healthy' as const }),
    });

    await kernel.destroy();
  });

  it('should handle check with long latency', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.set('slow', {
      check: async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { status: 'healthy' as const, latency: 50 };
      },
      timeout: '100ms',
    });

    await kernel.destroy();
  });

  it('should handle empty checks map', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    const context = kernel.getContext() as any;
    context.checks.clear();

    await kernel.init();
    await kernel.destroy();
  });
});
