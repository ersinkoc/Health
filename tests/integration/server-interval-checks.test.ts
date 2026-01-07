/**
 * @oxog/health - Server Interval Checks Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createServer } from '../../src/core/server.js';
import { sleep } from '../../src/utils/promise.js';

describe('Server Interval Checks Coverage', () => {
  it('should run interval checks', async () => {
    let checkCount = 0;

    const server = createServer({
      port: 0,
      checks: {
        intervalCheck: {
          handler: async () => {
            checkCount++;
            return { status: 'healthy' as const };
          },
          interval: '50ms',
        },
      },
    });

    await server.start();

    // Wait for initial check
    await sleep(150);

    await server.close();

    // Should have run at least once (initial run)
    expect(checkCount).toBeGreaterThanOrEqual(1);
  });

  it('should format Prometheus metrics', async () => {
    const server = createServer({
      port: 0,
      checks: {
        db: async () => ({ status: 'healthy' as const }),
        cache: async () => ({ status: 'degraded' as const }),
        api: async () => ({ status: 'unhealthy' as const, error: 'failed' }),
      },
    });

    await server.start();
    const port = server.port;

    // Wait for initial checks
    await sleep(100);

    // Fetch Prometheus metrics
    const response = await fetch(`http://localhost:${port}/metrics`);
    const text = await response.text();

    expect(text).toContain('health_check_status');
    expect(text).toContain('health_check_latency');
    expect(text).toContain('health_score');
    expect(text).toContain('db');
    expect(text).toContain('cache');
    expect(text).toContain('api');

    await server.close();
  });
});
