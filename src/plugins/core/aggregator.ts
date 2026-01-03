/**
 * @oxog/health - Aggregator Plugin
 *
 * Core plugin that aggregates check results into health status.
 * @packageDocumentation
 */

import type { Plugin, HealthContext, HealthStatus, CheckResult } from '../../types.js';
import { createAggregator } from '../../core/aggregator.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended context with aggregator methods.
 */
interface AggregatorContext extends HealthContext {
  aggregator: {
    aggregate: (results: Map<string, CheckResult>, uptime: number) => HealthStatus;
    getThresholds: () => { healthy: number; degraded: number };
    setThresholds: (thresholds: { healthy?: number; degraded?: number }) => void;
  };
}

// ============================================================================
// Plugin
// ============================================================================

/**
 * Aggregator plugin that calculates overall health status.
 *
 * This plugin is responsible for:
 * - Calculating health scores
 * - Determining overall status (healthy/degraded/unhealthy)
 * - Providing status to other plugins
 *
 * @example
 * ```typescript
 * const kernel = createHealthKernel({ port: 9000 });
 * kernel.use(httpPlugin);
 * kernel.use(runnerPlugin);
 * kernel.use(aggregatorPlugin);
 * ```
 */
export const aggregatorPlugin: Plugin<HealthContext> = {
  name: 'aggregator',
  version: '1.0.0',
  dependencies: ['runner'],

  install(kernel) {
    const context = kernel.getContext() as AggregatorContext;

    // Create aggregator
    const aggregator = createAggregator(context.options.thresholds);

    // Store in context
    context.aggregator = {
      aggregate: (results: Map<string, CheckResult>, uptime: number) => {
        return aggregator.aggregateSimple(results, uptime);
      },
      getThresholds: () => aggregator.getThresholds(),
      setThresholds: (thresholds) => aggregator.setThresholds(thresholds),
    };

    kernel.emit('aggregator:installed', { aggregator });
  },

  onInit(context) {
    const aggContext = context as AggregatorContext;
    aggContext.logger.info('Aggregator plugin initialized');
  },
};

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create an aggregator plugin instance with custom thresholds.
 *
 * @example
 * ```typescript
 * const myAggregatorPlugin = aggregatorPluginWithOptions({
 *   healthy: 90,
 *   degraded: 60
 * });
 * kernel.use(myAggregatorPlugin);
 * ```
 */
export function aggregatorPluginWithOptions(options: {
  healthy?: number;
  degraded?: number;
}): Plugin<HealthContext> {
  return {
    name: 'aggregator',
    version: '1.0.0',
    dependencies: ['runner'],

    install(kernel) {
      const context = kernel.getContext() as AggregatorContext;
      const aggregator = createAggregator({
        healthy: options.healthy,
        degraded: options.degraded,
      });

      context.aggregator = {
        aggregate: (results: Map<string, CheckResult>, uptime: number) => {
          return aggregator.aggregateSimple(results, uptime);
        },
        getThresholds: () => aggregator.getThresholds(),
        setThresholds: (thresholds) => aggregator.setThresholds(thresholds),
      };

      // Update context options with new thresholds
      const currentThresholds = context.options.thresholds;
      context.options.thresholds = {
        healthy: options.healthy ?? currentThresholds?.healthy ?? 70,
        degraded: options.degraded ?? currentThresholds?.degraded ?? 50,
      };
    },
  };
}
