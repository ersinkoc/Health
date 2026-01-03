/**
 * @oxog/health - Check Runner
 *
 * Execute health checks with timeout, retry, and parallel execution support.
 * @packageDocumentation
 */

import type { CheckConfig, CheckResult } from '../types.js';
import { timeout, retryWithDelay, sleep } from '../utils/promise.js';
import { measureTime, measureTimeSync } from '../utils/time.js';
import {
  CheckTimeoutError,
  CheckFailedError,
  checkTimeout,
  checkFailed,
} from '../errors.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Check execution result.
 */
export interface RunResult {
  /** Check name */
  name: string;
  /** Check result */
  result: CheckResult;
  /** Execution time in milliseconds */
  duration: number;
  /** Number of attempts */
  attempts: number;
}

/**
 * Check execution options.
 */
export interface RunOptions {
  /** Global timeout in milliseconds */
  timeout?: number;
  /** Global retry count */
  retries?: number;
  /** Run checks in parallel (default: true) */
  parallel?: boolean;
  /** Stop on first failure */
  stopOnFailure?: boolean;
}

// ============================================================================
// Check Runner Class
// ============================================================================

/**
 * Executes health checks with configurable timeout, retry, and concurrency.
 *
 * @example
 * ```typescript
 * const runner = new CheckRunner({ timeout: 5000, retries: 2 });
 * const result = await runner.run('database', { handler: () => db.ping() });
 * ```
 */
export class CheckRunner {
  private defaultTimeout: number;
  private defaultRetries: number;

  /**
   * Create a new check runner.
   *
   * @param options - Default options
   */
  constructor(options: Partial<RunOptions> = {}) {
    this.defaultTimeout = options.timeout ?? 5000;
    this.defaultRetries = options.retries ?? 2;
  }

  /**
   * Run a single health check.
   *
   * @param name - Check name
   * @param config - Check configuration
   * @returns Execution result
   *
   * @example
   * ```typescript
   * const result = await runner.run('database', {
   *   handler: () => db.ping(),
   *   timeout: 10000,
   *   retries: 3
   * });
   * ```
   */
  async run(name: string, config: CheckConfig): Promise<RunResult> {
    const timeoutMs = config.timeout ?? this.defaultTimeout;
    const retries = config.retries ?? this.defaultRetries;

    const { result, time: duration } = await measureTime(() =>
      this.executeWithRetry(name, config.handler, timeoutMs, retries)
    );

    return {
      name,
      result,
      duration,
      attempts: 1,
    };
  }

  /**
   * Run multiple health checks.
   *
   * @param checks - Map of check names to configurations
   * @param options - Execution options
   * @returns Map of results
   *
   * @example
   * ```typescript
   * const results = await runner.runAll({
   *   database: { handler: () => db.ping() },
   *   redis: { handler: () => redis.ping() }
   * }, { parallel: true });
   * ```
   */
  async runAll(
    checks: Map<string, CheckConfig>,
    options: RunOptions = {}
  ): Promise<Map<string, RunResult>> {
    const { parallel = true, stopOnFailure = false } = options;
    const results = new Map<string, RunResult>();

    if (parallel) {
      // Run all checks in parallel
      const promises: Promise<void>[] = [];

      for (const [name, config] of checks) {
        const promise = this.run(name, config).then((result) => {
          results.set(name, result);
          if (stopOnFailure && result.result.status === 'unhealthy') {
            throw new Error(`Check '${name}' failed`);
          }
        });
        promises.push(promise);
      }

      await Promise.allSettled(promises);
    } else {
      // Run checks sequentially
      for (const [name, config] of checks) {
        const result = await this.run(name, config);
        results.set(name, result);
        if (stopOnFailure && result.result.status === 'unhealthy') {
          break;
        }
      }
    }

    // Update attempts count
    for (const [name, config] of checks) {
      const result = results.get(name);
      if (result) {
        const retries = config.retries ?? this.defaultRetries;
        (result as unknown as { attempts: number }).attempts = Math.min(retries + 1, 1);
      }
    }

    return results;
  }

  /**
   * Run checks in parallel with a concurrency limit.
   *
   * @param checks - Map of check names to configurations
   * @param concurrency - Maximum concurrent checks
   * @param options - Execution options
   * @returns Map of results
   */
  async runWithConcurrency(
    checks: Map<string, CheckConfig>,
    concurrency: number,
    options: RunOptions = {}
  ): Promise<Map<string, RunResult>> {
    const results = new Map<string, RunResult>();
    const executing: Promise<void>[] = [];

    for (const [name, config] of checks) {
      const promise = this.run(name, config).then((result) => {
        results.set(name, result);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        const index = executing.findIndex((p) => p === promise);
        if (index !== -1) {
          executing.splice(index, 1);
        }
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Run a health check once without retry.
   *
   * @param name - Check name
   * @param handler - Check handler
   * @param timeoutMs - Timeout in milliseconds
   * @returns Check result
   */
  async runOnce(
    name: string,
    handler: CheckConfig['handler'],
    timeoutMs: number
  ): Promise<CheckResult> {
    try {
      const result = await timeout(this.executeHandler(handler), timeoutMs);
      return this.normalizeResult(result);
    } catch (error) {
      if (error instanceof CheckTimeoutError) {
        throw error;
      }
      throw checkFailed(name, error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Execute a handler with retry logic.
   */
  private async executeWithRetry(
    name: string,
    handler: CheckConfig['handler'],
    timeoutMs: number,
    retries: number
  ): Promise<CheckResult> {
    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts <= retries) {
      attempts++;

      try {
        const result = await this.runOnce(name, handler, timeoutMs);
        return result;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof CheckTimeoutError) {
          throw error;
        }

        if (attempts <= retries) {
          // Wait before retrying
          await sleep(100 * attempts);
        }
      }
    }

    throw checkFailed(name, lastError!);
  }

  /**
   * Execute a handler and return the result.
   */
  private async executeHandler(
    handler: CheckConfig['handler']
  ): Promise<CheckResult | void | boolean> {
    const result = handler();

    if (result instanceof Promise) {
      return await result;
    }

    return result;
  }

  /**
   * Normalize a handler result to CheckResult format.
   */
  private normalizeResult(
    result: CheckResult | void | boolean
  ): CheckResult {
    if (result === undefined || result === true) {
      return { status: 'healthy' };
    }

    if (result === false) {
      return { status: 'unhealthy' };
    }

    return result;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new check runner with default options.
 *
 * @example
 * ```typescript
 * const runner = createCheckRunner({ timeout: 5000 });
 * ```
 */
export function createCheckRunner(options?: Partial<RunOptions>): CheckRunner {
  return new CheckRunner(options);
}

/**
 * Create a simple check runner that executes checks once without retry.
 *
 * @example
 * ```typescript
 * const result = await simpleCheck(handler, 5000);
 * ```
 */
export async function simpleCheck(
  handler: CheckConfig['handler'],
  timeoutMs: number
): Promise<CheckResult> {
  const runner = new CheckRunner({ retries: 0 });
  return runner.runOnce('anonymous', handler, timeoutMs);
}

/**
 * Run multiple checks in parallel.
 *
 * @example
 * ```typescript
 * const results = await runChecks([
 *   { name: 'db', handler: () => db.ping(), timeout: 5000 },
 *   { name: 'redis', handler: () => redis.ping(), timeout: 3000 }
 * ]);
 * ```
 */
export async function runChecks(
  checks: Array<{ name: string; config: CheckConfig }>,
  options: RunOptions = {}
): Promise<Map<string, RunResult>> {
  const runner = createCheckRunner(options);
  const checksMap = new Map<string, CheckConfig>();

  for (const check of checks) {
    checksMap.set(check.name, check.config);
  }

  return runner.runAll(checksMap, options);
}
