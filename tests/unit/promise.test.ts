import { describe, it, expect, vi } from 'vitest';
import {
  timeout,
  withTimeout,
  timeoutOrUndefined,
  retry,
  retryWithDelay,
  sleep,
  sleepRandom,
  allSettled,
  race,
  anySettled,
  mapLimit,
  sequential,
  debounce,
  promisify,
  forEachAsync,
  reduceAsync,
  toResult,
  safe,
  swallow,
} from '../../src/utils/promise.js';

describe('promise.ts - Timeout', () => {
  describe('timeout', () => {
    it('should resolve if promise completes in time', async () => {
      const result = await timeout(Promise.resolve('success'), 1000);
      expect(result).toBe('success');
    });

    it('should reject if promise times out', async () => {
      await expect(timeout(new Promise(() => {}), 50)).rejects.toThrow('Promise timed out after 50ms');
    });

    it('should reject with custom error', async () => {
      const customError = new Error('Custom timeout');
      await expect(timeout(new Promise(() => {}), 50, customError)).rejects.toThrow('Custom timeout');
    });
  });

  describe('withTimeout', () => {
    it('should return result for successful function', async () => {
      const fn = withTimeout(async (a: number, b: number) => a + b, { timeout: 100 });
      const result = await fn(2, 3);
      expect(result).toBe(5);
    });

    it('should throw on timeout', async () => {
      const slowFn = withTimeout(async () => {
        await sleep(100);
        return 'done';
      }, { timeout: 50 });
      await expect(slowFn()).rejects.toThrow();
    });
  });

  describe('timeoutOrUndefined', () => {
    it('should return undefined on timeout', async () => {
      const result = await timeoutOrUndefined(new Promise(() => {}), 50);
      expect(result).toBeUndefined();
    });

    it('should return value on success', async () => {
      const result = await timeoutOrUndefined(Promise.resolve('value'), 1000);
      expect(result).toBe('value');
    });
  });
});

describe('promise.ts - Retry', () => {
  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        return 'success';
      };
      const result = await retry(fn, { maxAttempts: 3, baseDelay: 10 });
      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('fail');
        return 'success';
      };
      const result = await retry(fn, { maxAttempts: 3, baseDelay: 10 });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const fn = async () => {
        throw new Error('always fails');
      };
      await expect(retry(fn, { maxAttempts: 3, baseDelay: 10 })).rejects.toThrow('always fails');
    });

    it('should call onRetry callback', async () => {
      const attempts: number[] = [];
      const fn = async () => {
        attempts.push(1);
        throw new Error('fail');
      };
      const onRetry = vi.fn();
      await expect(retry(fn, { maxAttempts: 3, baseDelay: 10, onRetry })).rejects.toThrow();
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it('should respect maxDelay', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('fail');
        return 'success';
      };
      const start = Date.now();
      await retry(fn, { maxAttempts: 3, baseDelay: 100, maxDelay: 20 });
      const elapsed = Date.now() - start;
      // With maxDelay of 20, total delay should be ~40ms (20 + 20) instead of 100 + 200
      expect(elapsed).toBeLessThan(100);
    });

    it('should handle jitter', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('fail');
        return 'success';
      };
      const start = Date.now();
      await retry(fn, { maxAttempts: 3, baseDelay: 50, jitter: true });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(25);
    });
  });

  describe('retryWithDelay', () => {
    it('should retry with fixed delay', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) throw new Error('fail');
        return 'success';
      };
      const result = await retryWithDelay(fn, { maxAttempts: 3, delay: 10 });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const fn = async () => {
        throw new Error('always fails');
      };
      await expect(retryWithDelay(fn, { maxAttempts: 3, delay: 10 })).rejects.toThrow('always fails');
    });
  });
});

describe('promise.ts - Sleep', () => {
  describe('sleep', () => {
    it('should resolve after delay', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('sleepRandom', () => {
    it('should sleep for random duration in range', async () => {
      const start = Date.now();
      await sleepRandom(50, 100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(150);
    });
  });
});

describe('promise.ts - Collection Operations', () => {
  describe('allSettled', () => {
    it('should settle all promises', async () => {
      const results = await allSettled([
        Promise.resolve('success'),
        Promise.reject('fail'),
        Promise.resolve('another'),
      ]);
      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[0].value).toBe('success');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('race', () => {
    it('should return first resolved value', async () => {
      const result = await race([
        new Promise((resolve) => setTimeout(() => resolve('slow'), 100)),
        Promise.resolve('fast'),
      ]);
      expect(result).toBe('fast');
    });

    it('should return first resolved value (race does not reject)', async () => {
      const result = await race([
        new Promise((resolve) => setTimeout(() => resolve('slow'), 100)),
        Promise.resolve('fast'),
      ]);
      expect(result).toBe('fast');
    });
  });

  describe('anySettled', () => {
    it('should return first settled value', async () => {
      const result = await anySettled([
        new Promise((resolve) => setTimeout(() => resolve('slow'), 100)),
        Promise.reject('fast fail'),
      ]);
      expect(result.status).toBe('rejected');
    });
  });

  describe('mapLimit', () => {
    it('should map with concurrency limit', async () => {
      const items = [1, 2, 3, 4, 5];
      const start = Date.now();
      const results = await mapLimit(
        items,
        2,
        async (item) => {
          await sleep(50);
          return item * 2;
        }
      );
      const elapsed = Date.now() - start;
      expect(results).toEqual([2, 4, 6, 8, 10]);
      // With concurrency 2, should take ~150ms (3 batches * 50ms)
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should handle empty array', async () => {
      const results = await mapLimit([], 2, async (item) => item);
      expect(results).toEqual([]);
    });
  });

  describe('sequential', () => {
    it('should execute sequentially', async () => {
      const order: number[] = [];
      await sequential(
        [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)],
        (item) => {
          order.push(item);
        }
      );
      expect(order).toEqual([1, 2, 3]);
    });

    it('should work with async functions', async () => {
      const results = await sequential([() => Promise.resolve(1), () => Promise.resolve(2)]);
      expect(results).toEqual([1, 2]);
    });
  });

  describe('forEachAsync', () => {
    it('should iterate with async handler', async () => {
      const items: number[] = [];
      await forEachAsync([1, 2, 3], async (item) => {
        await sleep(5);
        items.push(item);
      });
      expect(items).toEqual([1, 2, 3]);
    });

    it('should handle empty array', async () => {
      const processed: number[] = [];
      await forEachAsync([], async (item) => {
        processed.push(item);
      });
      expect(processed).toEqual([]);
    });
  });

  describe('reduceAsync', () => {
    it('should reduce with async reducer', async () => {
      const result = await reduceAsync(
        [1, 2, 3, 4],
        async (acc, item) => acc + item,
        0
      );
      expect(result).toBe(10);
    });

    it('should handle initial value', async () => {
      const result = await reduceAsync(
        ['a', 'b', 'c'],
        async (acc, item) => acc + item,
        'start-'
      );
      expect(result).toBe('start-abc');
    });
  });
});

describe('promise.ts - Utilities', () => {
  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 50);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      await sleep(20);
      expect(fn).toHaveBeenCalledTimes(0);
      await sleep(60);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return promise', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const debouncedFn = debounce(fn, 50);
      const promise = debouncedFn();
      expect(promise).toBeInstanceOf(Promise);
      await sleep(60);
    });
  });

  describe('promisify', () => {
    it('should convert callback-based function', async () => {
      const mockCallbackFn = (arg: string, callback: (err: Error | null, result: string) => void) => {
        callback(null, `processed ${arg}`);
      };

      const promisified = promisify(mockCallbackFn);
      const result = await promisified('input');
      expect(result).toBe('processed input');
    });

    it('should handle errors', async () => {
      const mockCallbackFn = (callback: (err: Error | null, result?: string) => void) => {
        callback(new Error('callback error'));
      };

      const promisified = promisify(mockCallbackFn);
      await expect(promisified()).rejects.toThrow('callback error');
    });
  });

  describe('toResult', () => {
    it('should return [null, value] on success', async () => {
      const [error, result] = await toResult(Promise.resolve('success'));
      expect(error).toBeNull();
      expect(result).toBe('success');
    });

    it('should return [error, undefined] on failure', async () => {
      const testError = new Error('fail');
      const [error, result] = await toResult(Promise.reject(testError));
      expect(error).toBe(testError);
      expect(result).toBeUndefined();
    });
  });

  describe('safe', () => {
    it('should return [null, value] on success', async () => {
      const safeFn = safe(async (x: number) => x * 2);
      const [error, result] = await safeFn(5);
      expect(error).toBeNull();
      expect(result).toBe(10);
    });

    it('should return [error, undefined] on failure', async () => {
      const safeFn = safe(async () => {
        throw new Error('fail');
      });
      const [error, result] = await safeFn();
      expect(error).not.toBeNull();
      expect(result).toBeUndefined();
    });

    it('should pass arguments to wrapped function', async () => {
      const safeFn = safe(async (a: number, b: number) => a + b);
      const [error, result] = await safeFn(3, 4);
      expect(result).toBe(7);
    });
  });

  describe('swallow', () => {
    it('should return undefined on error', async () => {
      const result = await swallow(Promise.reject(new Error('fail')));
      expect(result).toBeUndefined();
    });

    it('should return value on success', async () => {
      const result = await swallow(Promise.resolve('success'));
      expect(result).toBe('success');
    });
  });
});
