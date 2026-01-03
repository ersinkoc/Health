/**
 * @oxog/health - Runner Plugin
 *
 * Core plugin that provides health check execution engine.
 * @packageDocumentation
 */

import type { Plugin, HealthContext, CheckConfig, CheckResult } from '../../types.js';
import type { RunOptions } from '../../core/check-runner.js';
import { createCheckRunner } from '../../core/check-runner.js';
import { IntervalParser } from '../../core/interval-parser.js';

// ============================================================================
// Types
// ============================================================================

// Module-level interval tracker for cleanup
const activeIntervals = new Set<ReturnType<typeof setInterval>>();

/**
 * Extended context with runner methods.
 */
interface RunnerContext extends HealthContext {
  runner: {
    run: (name: string, config: CheckConfig) => Promise<{ result: CheckResult; duration: number }>;
    runAll: (checks: Map<string, CheckConfig>, options?: RunOptions) => Promise<Map<string, { result: CheckResult; duration: number }>>;
  };
  intervalParser: IntervalParser;
}

// ============================================================================
// Plugin
// ============================================================================

/**
 * Runner plugin that executes health checks.
 *
 * This plugin is responsible for:
 * - Executing health checks with timeout and retry
 * - Managing check intervals
 * - Collecting check results
 *
 * @example
 * ```typescript
 * const kernel = createHealthKernel({ port: 9000 });
 * kernel.use(httpPlugin);
 * kernel.use(runnerPlugin);
 * ```
 */
export const runnerPlugin: Plugin<HealthContext> = {
  name: 'runner',
  version: '1.0.0',
  dependencies: [],

  install(kernel) {
    const context = kernel.getContext() as RunnerContext;

    // Create check runner
    const runner = createCheckRunner({
      timeout: context.options.timeout ?? 5000,
      retries: context.options.retries ?? 2,
    });

    // Create interval parser
    const intervalParser = new IntervalParser();

    // Store in context
    context.runner = {
      run: async (name: string, config: CheckConfig) => {
        const startTime = Date.now();
        const result = await runner.run(name, config);
        return {
          result: result.result,
          duration: Date.now() - startTime,
        };
      },
      runAll: async (checks: Map<string, CheckConfig>, options?: RunOptions) => {
        const results = await runner.runAll(checks, options);
        const withDuration = new Map<string, { result: CheckResult; duration: number }>();

        for (const [name, runResult] of results) {
          withDuration.set(name, {
            result: runResult.result,
            duration: runResult.duration,
          });
        }

        return withDuration;
      },
    };

    context.intervalParser = intervalParser;

    kernel.emit('runner:installed', { runner, intervalParser });
  },

  onInit(context: HealthContext) {
    const runnerContext = context as RunnerContext;

    // Register checks from options
    const checks = runnerContext.options.checks;
    if (checks) {
      for (const [name, check] of Object.entries(checks)) {
        const config = normalizeCheckConfig(check, {
          timeout: runnerContext.options.timeout ?? 5000,
          retries: runnerContext.options.retries ?? 2,
        });
        runnerContext.checks.set(name, config);
      }
    }

    // Start interval checks
    startIntervalChecks(runnerContext);

    runnerContext.logger.info(`Runner plugin initialized with ${runnerContext.checks.size} checks`);
  },

  onDestroy() {
    // Clear all active intervals
    for (const interval of activeIntervals) {
      clearInterval(interval);
    }
    activeIntervals.clear();
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize check configuration.
 */
function normalizeCheckConfig(
  check: CheckConfig['handler'] | CheckConfig,
  options: { timeout: number; retries: number }
): CheckConfig {
  if (typeof check === 'function') {
    return {
      handler: check,
      timeout: options.timeout,
      retries: options.retries,
      critical: false,
      weight: 100,
    };
  }

  return {
    handler: check.handler,
    timeout: check.timeout ?? options.timeout,
    retries: check.retries ?? options.retries,
    critical: check.critical ?? false,
    weight: check.weight ?? 100,
    interval: check.interval,
  };
}

/**
 * Start interval-based checks.
 */
function startIntervalChecks(context: RunnerContext): void {
  const globalInterval = context.options.interval ?? '30s';
  const globalIntervalMs = context.intervalParser.parse(globalInterval).milliseconds;

  for (const [name, config] of context.checks) {
    const intervalMs = config.interval
      ? context.intervalParser.parse(config.interval).milliseconds
      : globalIntervalMs;

    const timer = setInterval(async () => {
      try {
        const result = await context.runner.run(name, config);
        context.results.set(name, result.result);
        context.metrics.checks[name] = updateMetrics(
          context.metrics.checks[name],
          result.result
        );
      } catch (error) {
        context.logger.error(`Check '${name}' failed:`, error);
      }
    }, intervalMs);

    activeIntervals.add(timer);
  }
}

/**
 * Update metrics for a check.
 */
function updateMetrics(
  metrics: { success: number; failure: number; avgLatency: number; lastLatency: number; lastStatus: 'healthy' | 'unhealthy' | 'degraded' } | undefined,
  result: CheckResult
): { success: number; failure: number; avgLatency: number; lastLatency: number; lastStatus: 'healthy' | 'unhealthy' | 'degraded' } {
  const was = metrics || { success: 0, failure: 0, avgLatency: 0, lastLatency: 0, lastStatus: 'healthy' as const };

  const latency = result.latency || 0;
  const isSuccess = result.status === 'healthy';

  return {
    success: was.success + (isSuccess ? 1 : 0),
    failure: was.failure + (isSuccess ? 0 : 1),
    avgLatency: Math.round((was.avgLatency * (was.success + was.failure) + latency) / (was.success + was.failure + 1)),
    lastLatency: latency,
    lastStatus: result.status,
  };
}

// ============================================================================
// Extended Context
// ============================================================================

/**
 * Add intervals property to context.
 */
interface ExtendedContext extends HealthContext {
  intervals: ReturnType<typeof setInterval>[];
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create a runner plugin instance with custom options.
 *
 * @example
 * ```typescript
 * const myRunnerPlugin = runnerPluginWithOptions({
 *   timeout: 10000,
 *   retries: 3
 * });
 * kernel.use(myRunnerPlugin);
 * ```
 */
export function runnerPluginWithOptions(options: { timeout?: number; retries?: number }): Plugin<HealthContext> {
  return {
    name: 'runner',
    version: '1.0.0',
    dependencies: [],

    install(kernel) {
      const context = kernel.getContext();
      const runner = createCheckRunner({
        timeout: options.timeout ?? context.options.timeout,
        retries: options.retries ?? context.options.retries,
      });

      const intervalParser = new IntervalParser();

      (context as RunnerContext).runner = {
        run: async (name: string, config: CheckConfig) => {
          const result = await runner.run(name, config);
          return { result: result.result, duration: result.duration };
        },
        runAll: async (checks: Map<string, CheckConfig>, opts?: RunOptions) => {
          const results = await runner.runAll(checks, opts);
          const withDuration = new Map<string, { result: CheckResult; duration: number }>();

          for (const [name, runResult] of results) {
            withDuration.set(name, { result: runResult.result, duration: runResult.duration });
          }

          return withDuration;
        },
      };

      (context as RunnerContext).intervalParser = intervalParser;
    },
  };
}
