/**
 * @oxog/health - Promise Retry Exhaust Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { retry } from '../../src/utils/promise.js';

describe('Promise Retry Exhaust', () => {
  it('should throw last error after exhausting retries', async () => {
    let attempts = 0;

    // Triggers line 135 - throws lastError after all retries exhausted
    await expect(
      retry(
        async () => {
          attempts++;
          throw new Error(`Attempt ${attempts} failed`);
        },
        {
          maxAttempts: 3,
          baseDelay: 10,
        }
      )
    ).rejects.toThrow('Attempt 3 failed');

    expect(attempts).toBe(3);
  });

  it('should call onRetry callback on each retry', async () => {
    const onRetry = vi.fn();
    let attempts = 0;

    try {
      await retry(
        async () => {
          attempts++;
          throw new Error(`Attempt ${attempts}`);
        },
        {
          maxAttempts: 3,
          baseDelay: 10,
          onRetry,
        }
      );
    } catch {
      // Expected to fail
    }

    // onRetry should be called twice (before retry 2 and retry 3)
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});
