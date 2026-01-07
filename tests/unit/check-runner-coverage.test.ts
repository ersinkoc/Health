/**
 * @oxog/health - Check Runner Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { CheckRunner } from '../../src/core/check-runner.js';
import { CheckTimeoutError } from '../../src/errors.js';
import { sleep } from '../../src/utils/promise.js';

describe('CheckRunner Coverage - Retry Logic', () => {
  it('should retry on non-timeout errors', async () => {
    const runner = new CheckRunner();
    let attempts = 0;

    const handler = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return { status: 'healthy' as const, latency: 5 };
    };

    const result = await runner.run('retryTest', {
      handler,
      timeout: 5000,
      retries: 3,
      critical: false,
      weight: 100,
    });

    expect(result.result.status).toBe('healthy');
    expect(attempts).toBeGreaterThanOrEqual(3);
  });

  it('should throw timeout error without retrying', async () => {
    const runner = new CheckRunner();

    const handler = async () => {
      await sleep(200);
      return { status: 'healthy' as const };
    };

    await expect(
      runner.run('timeoutTest', {
        handler,
        timeout: 50,
        retries: 3,
        critical: false,
        weight: 100,
      })
    ).rejects.toThrow(); // Timeout errors are wrapped in CheckFailedError
  });

  it('should exhaust retries and fail', async () => {
    const runner = new CheckRunner();
    let attempts = 0;

    const handler = async () => {
      attempts++;
      throw new Error('Persistent failure');
    };

    await expect(
      runner.run('failingTest', {
        handler,
        timeout: 5000,
        retries: 2,
        critical: false,
        weight: 100,
      })
    ).rejects.toThrow();

    // Should have tried 3 times (1 initial + 2 retries)
    expect(attempts).toBe(3);
  });

  it('should run runOnce successfully', async () => {
    const runner = new CheckRunner();

    const result = await runner.runOnce(
      'onceTest',
      async () => ({ status: 'healthy' as const, latency: 10 }),
      5000
    );

    expect(result.status).toBe('healthy');
  });

  it('should handle runOnce timeout', async () => {
    const runner = new CheckRunner();

    await expect(
      runner.runOnce(
        'onceTimeout',
        async () => {
          await sleep(200);
          return { status: 'healthy' as const };
        },
        50
      )
    ).rejects.toThrow(); // Timeout errors are wrapped in CheckFailedError
  });

  it('should handle runOnce non-timeout error', async () => {
    const runner = new CheckRunner();

    await expect(
      runner.runOnce(
        'onceError',
        async () => {
          throw new Error('Check failed');
        },
        5000
      )
    ).rejects.toThrow();
  });

  it('should handle runOnce with non-Error thrown', async () => {
    const runner = new CheckRunner();

    await expect(
      runner.runOnce(
        'nonErrorThrow',
        async () => {
          throw 'string error';
        },
        5000
      )
    ).rejects.toThrow();
  });
});

describe('CheckRunner Coverage - Result Normalization', () => {
  it('should normalize boolean true result', async () => {
    const runner = new CheckRunner();

    const result = await runner.run('boolTrue', {
      handler: () => true,
      timeout: 5000,
      retries: 0,
      critical: false,
      weight: 100,
    });

    expect(result.result.status).toBe('healthy');
  });

  it('should normalize boolean false result', async () => {
    const runner = new CheckRunner();

    const result = await runner.run('boolFalse', {
      handler: () => false,
      timeout: 5000,
      retries: 0,
      critical: false,
      weight: 100,
    });

    expect(result.result.status).toBe('unhealthy');
  });

  it('should normalize undefined result', async () => {
    const runner = new CheckRunner();

    const result = await runner.run('undefined', {
      handler: () => undefined as unknown,
      timeout: 5000,
      retries: 0,
      critical: false,
      weight: 100,
    });

    expect(result.result.status).toBe('healthy');
  });
});
