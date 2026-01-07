/**
 * @oxog/health - Server serve() Function Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { serve, createServer } from '../../src/core/server.js';
import { sleep } from '../../src/utils/promise.js';

describe('serve() Function Coverage', () => {
  it('should create and start a health server', async () => {
    const server = await serve({
      port: 0,
      checks: {
        database: async () => ({ status: 'healthy' as const }),
      },
    });

    expect(server).toBeDefined();
    expect(server.port).toBeGreaterThan(0);

    await server.close();
  });

  it('should serve and respond to health endpoint', async () => {
    const server = await serve({
      port: 0,
      checks: {
        db: async () => ({ status: 'healthy' as const }),
        cache: async () => ({ status: 'healthy' as const }),
      },
    });

    const port = server.port;

    // Wait for initial checks
    await sleep(50);

    // Fetch health status
    const response = await fetch(`http://localhost:${port}/health`);
    const data = await response.json();

    expect(data.status).toBeDefined();
    expect(data.checks).toBeDefined();

    await server.close();
  });

  it('should serve condensed status format', async () => {
    const server = await serve({
      port: 0,
      checks: {
        primary: async () => ({ status: 'healthy' as const }),
      },
    });

    const port = server.port;
    await sleep(50);

    // Fetch health endpoint - this uses condensed status
    const response = await fetch(`http://localhost:${port}/health`);
    const data = await response.json();

    // Condensed format should have uptime, score, status, checks
    expect(data.uptime).toBeDefined();
    expect(data.score).toBeDefined();
    expect(data.status).toBeDefined();
    expect(data.checks).toBeDefined();
    expect(data.checks.primary).toBeDefined();
    expect(data.checks.primary.status).toBeDefined();

    await server.close();
  });
});

describe('createServer() Function Coverage', () => {
  it('should create a server without starting', async () => {
    const server = createServer({
      port: 0,
      checks: {
        test: async () => ({ status: 'healthy' as const }),
      },
    });

    expect(server).toBeDefined();
    // Server not started yet
    expect(server.port).toBe(0);

    await server.start();
    expect(server.port).toBeGreaterThan(0);

    await server.close();
  });
});
