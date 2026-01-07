/**
 * @oxog/health - Server JSON Metrics Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createServer } from '../../src/core/server.js';
import { sleep } from '../../src/utils/promise.js';

describe('Server JSON Metrics', () => {
  it('should format JSON metrics via Accept header', async () => {
    const server = createServer({
      port: 0,
      checks: {
        db: async () => ({ status: 'healthy' as const }),
        cache: async () => ({ status: 'degraded' as const }),
      },
    });

    await server.start();
    const port = server.port;

    await sleep(50);

    // Request JSON format metrics
    const response = await fetch(`http://localhost:${port}/metrics`, {
      headers: {
        Accept: 'application/json',
      },
    });

    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data.uptime).toBeDefined();
    expect(data.score).toBeDefined();
    expect(data.status).toBeDefined();
    expect(data.checks).toBeDefined();
    expect(data.checks.db).toBeDefined();
    expect(data.checks.cache).toBeDefined();

    await server.close();
  });

  it('should return Prometheus format by default', async () => {
    const server = createServer({
      port: 0,
      checks: {
        api: async () => ({ status: 'healthy' as const }),
      },
    });

    await server.start();
    const port = server.port;

    await sleep(50);

    // Request without Accept header (defaults to Prometheus)
    const response = await fetch(`http://localhost:${port}/metrics`);

    const text = await response.text();
    expect(text).toContain('# HELP');
    expect(text).toContain('health_check_status');

    await server.close();
  });

  it('should handle interval check timer cleanup', async () => {
    const server = createServer({
      port: 0,
      checks: {
        intervalTest: {
          handler: async () => ({ status: 'healthy' as const }),
          interval: '100ms',
        },
      },
    });

    await server.start();

    // Wait for at least one interval check
    await sleep(150);

    // Close should clean up interval timer
    await server.close();

    // No assertion needed - just verifying no errors during cleanup
    expect(true).toBe(true);
  });
});
