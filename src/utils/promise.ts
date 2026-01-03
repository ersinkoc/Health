/**
 * @oxog/health - Promise Utilities
 *
 * Zero-dependency promise utilities for timeout, retry, and concurrency.
 * @packageDocumentation
 */

// ============================================================================
// Timeout
// ============================================================================

/**
 * Add a timeout to a promise.
 *
 * @example
 * ```typescript
 * const result = await timeout(fetchData(), 5000, new Error('Request timed out'));
 * ```
 */
export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  error?: Error
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(error || new Error(`Promise timed out after ${ms}ms`));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

/**
 * Create a timeout-aware promise wrapper.
 *
 * @example
 * ```typescript
 * const fetchWithTimeout = withTimeout(fetchData, { timeout: 5000 });
 * const result = await fetchWithTimeout();
 * ```
 */
export function withTimeout<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  options: { timeout: number; error?: Error }
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    return timeout(fn(...args), options.timeout, options.error);
  };
}

/**
 * Timeout that returns undefined instead of throwing.
 *
 * @example
 * ```typescript
 * const result = await timeoutOrUndefined(fetchData(), 5000);
 * // Returns undefined if timed out
 * ```
 */
export async function timeoutOrUndefined<T>(
  promise: Promise<T>,
  ms: number
): Promise<T | undefined> {
  try {
    return await timeout(promise, ms);
  } catch {
    return undefined;
  }
}

// ============================================================================
// Retry
// ============================================================================

/**
 * Retry a function with exponential backoff.
 *
 * @example
 * ```typescript
 * const result = await retry(fetchData, {
 *   maxAttempts: 3,
 *   baseDelay: 1000,
 *   maxDelay: 10000,
 *   factor: 2
 * });
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay?: number;
    factor?: number;
    jitter?: boolean;
    onRetry?: (error: Error, attempt: number) => void;
  }
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay = Infinity, factor = 2, jitter = false, onRetry } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      let delay = baseDelay * Math.pow(factor, attempt - 1);

      if (delay > maxDelay) {
        delay = maxDelay;
      }

      if (jitter) {
        delay = delay * (0.5 + Math.random());
      }

      if (onRetry) {
        onRetry(lastError, attempt);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry a function with a fixed delay.
 *
 * @example
 * ```typescript
 * const result = await retryWithDelay(fetchData, {
 *   maxAttempts: 3,
 *   delay: 1000
 * });
 * ```
 */
export async function retryWithDelay<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    delay: number;
    onRetry?: (error: Error, attempt: number) => void;
  }
): Promise<T> {
  const { maxAttempts, delay, onRetry } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(lastError, attempt);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

// ============================================================================
// Sleep/Delay
// ============================================================================

/**
 * Sleep for a specified duration.
 *
 * @example
 * ```typescript
 * await sleep(1000); // Sleep for 1 second
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Sleep for a random duration within a range.
 *
 * @example
 * ```typescript
 * await sleepRandom(100, 500); // Sleep for 100-500ms
 * ```
 */
export function sleepRandom(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return sleep(delay);
}

// ============================================================================
// Concurrency
// ============================================================================

/**
 * Wait for all promises to settle (resolve or reject).
 *
 * @example
 * ```typescript
 * const results = await allSettled([
 *   fetchData1(),
 *   fetchData2(),
 *   fetchData3()
 * ]);
 * ```
 */
export function allSettled<T>(
  promises: Array<Promise<T>>
): Promise<Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: Error }>> {
  return Promise.all(
    promises.map((promise) =>
      promise
        .then((value) => ({ status: 'fulfilled' as const, value }))
        .catch((reason) => ({ status: 'rejected' as const, reason }))
    )
  );
}

/**
 * Wait for the first promise to resolve.
 *
 * @example
 * ```typescript
 * const result = await race([
 *   fetchFastData(),
 *   timeout(fetchSlowData(), 1000)
 * ]);
 * ```
 */
export function race<T>(promises: Array<Promise<T>>): Promise<T> {
  return Promise.race(promises);
}

/**
 * Wait for the first promise to settle (resolve or reject).
 *
 * @example
 * ```typescript
 * const result = await anySettled([
 *   fetchPrimary(),
 *   fetchSecondary()
 * ]);
 * ```
 */
export function anySettled<T>(
  promises: Array<Promise<T>>
): Promise<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: Error }> {
  return new Promise((resolve) => {
    for (const promise of promises) {
      promise
        .then((value) => resolve({ status: 'fulfilled', value }))
        .catch((reason) => resolve({ status: 'rejected', reason }));
    }
  });
}

/**
 * Execute promises with a concurrency limit.
 *
 * @example
 * ```typescript
 * const results = await mapLimit(urls, 3, (url) => fetch(url));
 * ```
 */
export async function mapLimit<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<unknown>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const promise = Promise.resolve().then(() => fn(item, i));
    results.push(promise as unknown as R);
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      const index = executing.findIndex((p) => p === promise);
      if (index !== -1) {
        executing.splice(index, 1);
      }
    }
  }

  return Promise.all(results);
}

/**
 * Execute promises sequentially.
 *
 * @example
 * ```typescript
 * const results = await sequential([() => fetch1(), () => fetch2()]);
 * ```
 */
export async function sequential<T, R>(
  fns: Array<() => Promise<T>>,
  mapper?: (result: T, index: number) => R
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < fns.length; i++) {
    const result = await fns[i]();
    results.push(mapper ? mapper(result, i) : (result as unknown as R));
  }

  return results;
}

// ============================================================================
// Debounce/Throttle
// ============================================================================

/**
 * Create a debounced promise function.
 *
 * @example
 * ```typescript
 * const debouncedFetch = debounce(fetchData, 300);
 * ```
 */
export function debounce<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result as ReturnType<T>);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

// ============================================================================
// Conversion
// ============================================================================

/**
 * Convert a callback-based function to promise-based.
 *
 * @example
 * ```typescript
 * const readFile = promisify(fs.readFile);
 * const content = await readFile('file.txt', 'utf8');
 * ```
 */
export function promisify<T, Args extends unknown[]>(
  fn: (callback: (error: Error | null, result?: T) => void) => void
): (...args: Args) => Promise<T>;

export function promisify<T, A, B>(
  fn: (a: A, b: (error: Error | null, result?: T) => void) => void
): (a: A) => Promise<T>;

export function promisify<T>(
  fn: (callback: (error: Error | null, result?: T) => void) => void
): () => Promise<T> {
  return (...args: unknown[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      fn(...args, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result as T);
        }
      });
    });
  };
}

/**
 * Convert an iterator to a promise that resolves when all items are processed.
 *
 * @example
 * ```typescript
 * await forEachAsync(items, async (item) => {
 *   await process(item);
 * });
 * ```
 */
export async function forEachAsync<T>(
  items: T[],
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    await fn(items[i], i);
  }
}

/**
 * Convert a reducer to a promise-based reducer.
 *
 * @example
 * ```typescript
 * const sum = await reduceAsync([1, 2, 3, 4], async (acc, item) => acc + item, 0);
 * // sum = 10
 * ```
 */
export async function reduceAsync<T, R>(
  items: T[],
  fn: (accumulator: R, item: T, index: number) => Promise<R>,
  initialValue: R
): Promise<R> {
  let accumulator = initialValue;

  for (let i = 0; i < items.length; i++) {
    accumulator = await fn(accumulator, items[i], i);
  }

  return accumulator;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Convert a promise result to a tuple of [error, result].
 *
 * @example
 * ```typescript
 * const [error, result] = toResult(fetchData());
 * if (error) console.error(error);
 * else console.log(result);
 * ```
 */
export async function toResult<T>(
  promise: Promise<T>
): Promise<[Error | null, T | undefined]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error as Error, undefined];
  }
}

/**
 * Wrap a function to catch and return errors instead of throwing.
 *
 * @example
 * ```typescript
 * const safeFetch = safe(async () => fetchData());
 * const [error, result] = await toResult(safeFetch());
 * ```
 */
export function safe<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>
): (...args: Args) => Promise<[Error | null, T | undefined]> {
  return async (...args: Args): Promise<[Error | null, T | undefined]> => {
    try {
      const result = await fn(...args);
      return [null, result];
    } catch (error) {
      return [error as Error, undefined];
    }
  };
}

/**
 * Execute a function and return undefined on error.
 *
 * @example
 * ```typescript
 * const result = swallow(async () => fetchData());
 * // Returns undefined if fetchData throws
 * ```
 */
export async function swallow<T>(
  promise: Promise<T>
): Promise<T | undefined> {
  try {
    return await promise;
  } catch {
    return undefined;
  }
}

// ============================================================================
