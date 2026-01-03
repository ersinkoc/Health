/**
 * @oxog/health - Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { serve, createServer } from '../../src/core/server.js';
import type { HealthServer } from '../../src/types.js';

describe('Server Integration', () => {
  let server: HealthServer;

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('start and close', () => {
    it('should start server and return port', async () => {
      server = await serve({ port: 0 }); // Use random port
      expect(server.port).toBeGreaterThan(0);
    });

    it('should close server gracefully', async () => {
      server = await serve({ port: 0 });
      await server.close();
    });

    it('should allow registering checks after creation', async () => {
      server = createServer({ port: 0 });

      server.register('test', async () => {
        return { status: 'healthy' };
      });

      await server.start();
      await server.close();
    });
  });

  describe('check management', () => {
    it('should list registered checks', async () => {
      server = createServer({ port: 0 });
      server.register('check1', async () => ({ status: 'healthy' }));
      server.register('check2', async () => ({ status: 'healthy' }));

      const checks = server.list();
      expect(checks).toContain('check1');
      expect(checks).toContain('check2');
    });

    it('should unregister checks', async () => {
      server = createServer({ port: 0 });
      server.register('test', async () => ({ status: 'healthy' }));

      const removed = server.unregister('test');
      expect(removed).toBe(true);

      const checks = server.list();
      expect(checks).not.toContain('test');
    });

    it('should return false when unregistering non-existent check', async () => {
      server = createServer({ port: 0 });
      const removed = server.unregister('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('status', () => {
    it('should return health status', async () => {
      server = createServer({ port: 0 });
      server.register('test', async () => ({ status: 'healthy' }));

      await server.start();
      const status = await server.status();

      expect(status.status).toBe('healthy');
      expect(status.checks.test).toBeDefined();
    });

    it('should include uptime', async () => {
      server = await serve({ port: 0 });
      const status = await server.status();

      expect(status.uptime).toBeGreaterThanOrEqual(0);
      expect(status.timestamp).toBeDefined();
    });
  });
});
