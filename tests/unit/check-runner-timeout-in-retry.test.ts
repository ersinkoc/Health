/**
 * @oxog/health - CheckRunner Timeout in Retry Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createCheckRunner } from '../../src/core/check-runner.js';
import type { CheckConfig } from '../../src/types.js';

describe('CheckRunner Timeout in Retry', () => {
  it('should throw timeout error immediately in runOnce', async () => {
    const runner = createCheckRunner({ timeout: 50 });

    const config: CheckConfig = {
      handler: async () => {
        // This will timeout
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { status: 'healthy' as const };
      },
      timeout: 50,
    };

    // Triggers lines 222-224 - timeout error in runOnce
    await expect(runner.run('timeoutCheck', config)).rejects.toThrow('timed out');
  });

  it('should handle timeout error with retries configured', async () => {
    const runner = createCheckRunner({ timeout: 50, retries: 2 });
    let attempts = 0;

    const config: CheckConfig = {
      handler: async () => {
        attempts++;
        // This will timeout
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { status: 'healthy' as const };
      },
      timeout: 50,
      retries: 2,
    };

    // Triggers lines 254-256 - timeout error in executeWithRetry
    await expect(runner.run('timeoutWithRetries', config)).rejects.toThrow('timed out');

    // Verify attempts were made
    expect(attempts).toBeGreaterThanOrEqual(1);
  });
});
