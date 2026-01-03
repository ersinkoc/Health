/**
 * @oxog/health - Thresholds Plugin
 *
 * Optional plugin that provides configurable threshold management.
 * @packageDocumentation
 */

import type { Plugin, HealthContext, ThresholdConfig } from '../../types.js';
import type { Aggregator } from '../../core/aggregator.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended context with threshold management methods.
 */
interface ThresholdsContext extends HealthContext {
  thresholds: {
    get: () => { healthy: number; degraded: number };
    set: (config: ThresholdConfig) => void;
    reset: () => void;
  };
  aggregator: Aggregator;
}

// ============================================================================
// Default Thresholds
// ============================================================================

const DEFAULT_HEALTHY = 80;
const DEFAULT_DEGRADED = 50;

// ============================================================================
// Plugin
// ============================================================================

/**
 * Thresholds plugin that provides configurable threshold management.
 *
 * This plugin is responsible for:
 * - Storing threshold configuration
 * - Providing get/set methods for thresholds
 * - Validating threshold values
 *
 * @example
 * ```typescript
 * const kernel = createHealthKernel({ port: 9000 });
 * kernel.use(httpPlugin);
 * kernel.use(runnerPlugin);
 * kernel.use(aggregatorPlugin);
 * kernel.use(thresholdsPlugin);
 * ```
 */
export const thresholdsPlugin: Plugin<HealthContext> = {
  name: 'thresholds',
  version: '1.0.0',
  dependencies: ['aggregator'],

  install(kernel) {
    const context = kernel.getContext() as ThresholdsContext;
    const initialThresholds = context.options.thresholds;

    // Initialize thresholds
    let healthy = initialThresholds?.healthy ?? DEFAULT_HEALTHY;
    let degraded = initialThresholds?.degraded ?? DEFAULT_DEGRADED;

    // Store in context
    context.thresholds = {
      get: () => ({ healthy, degraded }),
      set: (config: ThresholdConfig) => {
        if (config.healthy !== undefined) {
          validateThreshold('healthy', config.healthy);
          healthy = config.healthy;
        }
        if (config.degraded !== undefined) {
          validateThreshold('degraded', config.degraded);
          degraded = config.degraded;
        }

        // Update aggregator
        context.aggregator.setThresholds({ healthy, degraded });

        kernel.emit('thresholds:changed', { healthy, degraded });
      },
      reset: () => {
        healthy = DEFAULT_HEALTHY;
        degraded = DEFAULT_DEGRADED;
        context.aggregator.setThresholds({ healthy, degraded });
        kernel.emit('thresholds:reset', { healthy, degraded });
      },
    };

    // Set initial thresholds
    context.aggregator.setThresholds({ healthy, degraded });

    kernel.emit('thresholds:installed', { healthy, degraded });
  },

  onInit(context) {
    const thresholdsContext = context as ThresholdsContext;
    const current = thresholdsContext.thresholds.get();
    thresholdsContext.logger.info(
      `Thresholds plugin initialized (healthy: ${current.healthy}, degraded: ${current.degraded})`
    );
  },
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a threshold value.
 */
function validateThreshold(name: string, value: number): void {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid ${name} threshold: must be a number`);
  }

  if (value < 0 || value > 100) {
    throw new Error(`Invalid ${name} threshold: must be between 0 and 100`);
  }
}

/**
 * Check if a threshold value is valid.
 */
export function isValidThreshold(value: unknown): boolean {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return false;
  }
  return value >= 0 && value <= 100;
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create a thresholds plugin instance with custom defaults.
 *
 * @example
 * ```typescript
 * const myThresholdsPlugin = thresholdsPluginWithOptions({
 *   healthy: 90,
 *   degraded: 60
 * });
 * kernel.use(myThresholdsPlugin);
 * ```
 */
export function thresholdsPluginWithOptions(options: ThresholdConfig): Plugin<HealthContext> {
  return {
    name: 'thresholds',
    version: '1.0.0',
    dependencies: ['aggregator'],

    install(kernel) {
      const context = kernel.getContext() as ThresholdsContext;

      let healthy = options.healthy ?? DEFAULT_HEALTHY;
      let degraded = options.degraded ?? DEFAULT_DEGRADED;

      context.thresholds = {
        get: () => ({ healthy, degraded }),
        set: (config: ThresholdConfig) => {
          if (config.healthy !== undefined) {
            validateThreshold('healthy', config.healthy);
            healthy = config.healthy;
          }
          if (config.degraded !== undefined) {
            validateThreshold('degraded', config.degraded);
            degraded = config.degraded;
          }
          context.aggregator.setThresholds({ healthy, degraded });
        },
        reset: () => {
          healthy = options.healthy ?? DEFAULT_HEALTHY;
          degraded = options.degraded ?? DEFAULT_DEGRADED;
          context.aggregator.setThresholds({ healthy, degraded });
        },
      };

      context.aggregator.setThresholds({ healthy, degraded });
    },
  };
}

// ============================================================================
// Exports
// ============================================================================
