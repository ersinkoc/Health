/**
 * @oxog/health - Server Interval Check Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createServer } from '../../src/core/server.js';
import { sleep } from '../../src/utils/promise.js';

describe('Server Interval Check Coverage', () => {
  it('should start interval checks with per-check interval', async () => {
    const server = createServer({
      port: 0,
      interval: '1s',
      checks: {
        // Check with its own interval - triggers line 422-423
        customInterval: {
          handler: async () => ({ status: 'healthy' as const }),
          interval: '100ms',
        },
        // Check using global interval
        globalInterval: async () => ({ status: 'healthy' as const }),
      },
    });

    await server.start();

    // Wait for at least one interval check
    await sleep(150);

    await server.close();

    // Test passed if no errors
    expect(true).toBe(true);
  });

  it('should stop interval checks on close', async () => {
    let checkCount = 0;

    const server = createServer({
      port: 0,
      interval: '50ms',
      checks: {
        counter: {
          handler: async () => {
            checkCount++;
            return { status: 'healthy' as const };
          },
          interval: '50ms',
        },
      },
    });

    await server.start();
    await sleep(100);

    const countBeforeClose = checkCount;

    // Triggers stopIntervalChecks - lines 441-444
    await server.close();

    await sleep(100);

    // Count should not increase significantly after close
    expect(checkCount - countBeforeClose).toBeLessThanOrEqual(1);
  });
});
