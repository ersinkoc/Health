/**
 * @oxog/health - Serve Function Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { serve } from '../../src/core/server.js';
import { sleep } from '../../src/utils/promise.js';

describe('serve() Function', () => {
  it('should create and start server using serve()', async () => {
    const server = await serve({
      port: 0,
      checks: {
        basic: async () => ({ status: 'healthy' as const }),
      },
    });

    expect(server.port).toBeGreaterThan(0);

    // Test that server is running
    const response = await fetch(`http://localhost:${server.port}/health`);
    expect(response.status).toBe(200);

    await server.close();
  });

  it('should serve health endpoint with multiple checks', async () => {
    const server = await serve({
      port: 0,
      checks: {
        db: async () => ({ status: 'healthy' as const }),
        cache: async () => ({ status: 'degraded' as const }),
      },
    });

    await sleep(50);

    const response = await fetch(`http://localhost:${server.port}/health`);
    const data = await response.json();

    expect(data.status).toBeDefined();
    expect(data.checks).toBeDefined();

    await server.close();
  });

  it('should serve metrics endpoint', async () => {
    const server = await serve({
      port: 0,
      checks: {
        api: async () => ({ status: 'healthy' as const }),
      },
    });

    await sleep(50);

    const response = await fetch(`http://localhost:${server.port}/metrics`);
    const text = await response.text();

    expect(text).toContain('health_');

    await server.close();
  });
});
