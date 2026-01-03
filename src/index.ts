/**
 * @oxog/health - Main Entry Point
 *
 * Zero-dependency health check server with Kubernetes-compatible probes and metrics exposure.
 *
 * @packageDocumentation
 * @version 1.0.0
 * @license MIT
 * @author Ersin Koç
 *
 * @example
 * ```typescript
 * import { health } from '@oxog/health';
 *
 * const server = health.serve({
 *   port: 9000,
 *   checks: {
 *     database: () => db.ping(),
 *     redis: () => redis.ping()
 *   }
 * });
 *
 * await server.start();
 * ```
 */

import type {
  ServeOptions,
  CheckHandler,
  CheckConfig,
  HealthServer,
  HealthStatus,
  OneShotCheckOptions,
  OneShotCheckResult,
  RemoteCheckOptions,
  RemoteCheckResult,
  ThresholdConfig,
  Plugin,
  HealthKernel,
} from './types.js';
import { serve, createServer } from './core/server.js';
import { createCheckRunner, runChecks, simpleCheck } from './core/check-runner.js';
import { createAggregator } from './core/aggregator.js';
import { createRouter, Router } from './core/router.js';
import { IntervalParser, intervalParser, parseInterval, formatInterval } from './core/interval-parser.js';
import { Kernel, createHealthKernel } from './kernel.js';

// Core plugins
import { httpPlugin, httpPluginWithOptions } from './plugins/core/http.js';
import { runnerPlugin, runnerPluginWithOptions } from './plugins/core/runner.js';
import { aggregatorPlugin, aggregatorPluginWithOptions } from './plugins/core/aggregator.js';

// Optional plugins
import { metricsPlugin, metricsPluginWithOptions } from './plugins/optional/metrics.js';
import { cliPlugin, cliPluginWithOptions, main as cliMain } from './plugins/optional/cli.js';
import { thresholdsPlugin, thresholdsPluginWithOptions } from './plugins/optional/thresholds.js';
import { historyPlugin, historyPluginWithOptions } from './plugins/optional/history.js';

// Re-export types
export type {
  ServeOptions,
  CheckHandler,
  CheckConfig,
  HealthServer,
  HealthStatus,
  OneShotCheckOptions,
  OneShotCheckResult,
  RemoteCheckOptions,
  RemoteCheckResult,
  ThresholdConfig,
  Plugin,
  HealthKernel,
};

// ============================================================================
// Health Object
// ============================================================================

/**
 * Main health check API object.
 *
 * Provides methods for:
 * - Starting a health server: `health.serve()`
 * - Running one-shot checks: `health.check()`
 * - Checking remote endpoints: `health.checkRemote()`
 * - Creating custom kernels: `health.create()`
 */
export const health = {
  /**
   * Start a health check HTTP server.
   *
   * @param options - Server configuration
   * @returns Health server instance
   *
   * @example
   * ```typescript
   * const server = health.serve({
   *   port: 9000,
   *   host: '0.0.0.0',
   *   checks: {
   *     database: () => db.ping(),
   *     redis: () => redis.ping()
   *   }
   * });
   * await server.start();
   * ```
   */
  serve: async (options: ServeOptions): Promise<HealthServer> => {
    const server = await serve(options);
    return server;
  },

  /**
   * Run one-shot health checks without starting a server.
   *
   * @param options - Check options
   * @returns Check result
   *
   * @example
   * ```typescript
   * const result = await health.check({
   *   checks: {
   *     database: () => db.ping(),
   *     redis: () => redis.ping()
   *   }
   * });
   * console.log(result.status); // 'healthy' | 'degraded' | 'unhealthy'
   * ```
   */
  check: async (options: OneShotCheckOptions): Promise<OneShotCheckResult> => {
    const startTime = Date.now();
    const runner = createCheckRunner({ timeout: options.timeout ?? 5000 });

    const checks = new Map<string, CheckConfig>();
    for (const [name, check] of Object.entries(options.checks)) {
      if (typeof check === 'function') {
        checks.set(name, { handler: check });
      } else {
        checks.set(name, check);
      }
    }

    const results = await runner.runAll(checks, { parallel: options.parallel ?? true });
    const aggregator = createAggregator();

    const checkResults = new Map<string, { result: { status: string; latency?: number; error?: string }; duration: number }>();
    for (const [name, result] of results) {
      checkResults.set(name, {
        result: {
          status: result.result.status,
          latency: result.result.latency,
          error: result.result.error,
        },
        duration: result.duration,
      });
    }

    const status = aggregator.aggregateSimple(
      new Map(
        Array.from(checkResults.entries()).map(([name, { result }]) => [
          name,
          { status: result.status as 'healthy' | 'unhealthy' | 'degraded', latency: result.latency, error: result.error },
        ])
      ),
      0
    );

    return {
      healthy: status.status === 'healthy',
      score: status.score,
      status: status.status,
      checks: status.checks,
      duration: Date.now() - startTime,
    };
  },

  /**
   * Check a remote health endpoint.
   *
   * @param url - Health endpoint URL
   * @param options - Check options
   * @returns Remote check result
   *
   * @example
   * ```typescript
   * const result = await health.checkRemote('http://localhost:9000/health');
   * console.log(result.status); // 'healthy' | 'degraded' | 'unhealthy'
   * ```
   */
  checkRemote: async (
    url: string,
    options?: RemoteCheckOptions
  ): Promise<RemoteCheckResult> => {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options?.timeout ?? 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timeoutId);

      const data = await response.json() as HealthStatus;
      const latency = Date.now() - startTime;

      return {
        status: data.status,
        data,
        statusCode: response.status,
        latency,
      };
    } catch (error) {
      return {
        status: 'error',
        error: (error as Error).message,
        latency: Date.now() - startTime,
      };
    }
  },

  /**
   * Create a custom health kernel with plugin support.
   *
   * @param options - Kernel options
   * @returns Health kernel instance
   *
   * @example
   * ```typescript
   * const kernel = health.create({ port: 9000 });
   * kernel.use(httpPlugin);
   * kernel.use(runnerPlugin);
   * kernel.use(aggregatorPlugin);
   * await kernel.init();
   * ```
   */
  create: (options?: ServeOptions): HealthKernel => {
    return createHealthKernel(options || { port: 9000 });
  },
};

// ============================================================================
// Core Exports
// ============================================================================

// Server
export { serve, createServer };

// Check Runner
export { createCheckRunner, runChecks, simpleCheck };

// Aggregator
export { createAggregator };

// Router
export { createRouter, Router };

// Interval Parser
export { IntervalParser, intervalParser, parseInterval, formatInterval };

// Kernel
export { Kernel, createHealthKernel };

// ============================================================================
// Plugin Exports
// ============================================================================

// Core Plugins
export { httpPlugin, httpPluginWithOptions };
export { runnerPlugin, runnerPluginWithOptions };
export { aggregatorPlugin, aggregatorPluginWithOptions };

// Optional Plugins
export { metricsPlugin, metricsPluginWithOptions };
export { cliPlugin, cliPluginWithOptions };
export { thresholdsPlugin, thresholdsPluginWithOptions };
export { historyPlugin, historyPluginWithOptions };

// ============================================================================
// CLI Export
// ============================================================================

/**
 * CLI entry point function.
 *
 * @example
 * ```bash
 * npx @oxog/health serve --port 9000
 * ```
 */
export { cliMain as main };

// ============================================================================
// Version
// ============================================================================

/**
 * Package version.
 */
export const VERSION = '1.0.0';

// ============================================================================
// Default Export (CommonJS compatibility)
// ============================================================================

export default health;
