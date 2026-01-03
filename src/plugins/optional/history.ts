/**
 * @oxog/health - History Plugin
 *
 * Optional plugin that provides check history retention.
 * @packageDocumentation
 */

import type { Plugin, HealthContext, CheckResult } from '../../types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * History entry for a single check.
 */
export interface HistoryEntry {
  /** Check name */
  name: string;
  /** Result */
  result: CheckResult;
  /** Timestamp */
  timestamp: string;
  /** Duration in milliseconds */
  duration: number;
}

/**
 * History for all checks.
 */
export interface CheckHistory {
  /** Overall history entries */
  overall: HistoryEntry[];
  /** Per-check history */
  perCheck: Map<string, HistoryEntry[]>;
}

/**
 * Extended context with history methods.
 */
interface HistoryContext extends HealthContext {
  history: {
    getHistory: () => CheckHistory;
    getCheckHistory: (name: string) => HistoryEntry[];
    getOverallHistory: () => HistoryEntry[];
    clearHistory: () => void;
    clearCheckHistory: (name: string) => void;
    getTrends: (name: string) => {
      avgLatency: number;
      successRate: number;
      status: 'improving' | 'stable' | 'degrading';
    };
  };
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_MAX_PER_CHECK = 50;

// ============================================================================
// Plugin
// ============================================================================

/**
 * History plugin that provides check history retention.
 *
 * This plugin is responsible for:
 * - Storing check results history
 * - Providing history access methods
 * - Calculating trends
 * - Managing history size limits
 *
 * @example
 * ```typescript
 * const kernel = createHealthKernel({ port: 9000 });
 * kernel.use(httpPlugin);
 * kernel.use(runnerPlugin);
 * kernel.use(aggregatorPlugin);
 * kernel.use(historyPlugin);
 * ```
 */
export const historyPlugin: Plugin<HealthContext> = {
  name: 'history',
  version: '1.0.0',
  dependencies: ['runner'],

  install(kernel) {
    const context = kernel.getContext() as HistoryContext;

    // Initialize history storage
    const history: CheckHistory = {
      overall: [],
      perCheck: new Map(),
    };

    // Store in context
    context.history = {
      getHistory: () => history,

      getCheckHistory: (name: string) => {
        return history.perCheck.get(name) || [];
      },

      getOverallHistory: () => {
        return history.overall;
      },

      clearHistory: () => {
        history.overall = [];
        history.perCheck.clear();
        kernel.emit('history:cleared', {});
      },

      clearCheckHistory: (name: string) => {
        history.perCheck.delete(name);
        kernel.emit('history:checkCleared', { name });
      },

      getTrends: (name: string) => {
        const entries = history.perCheck.get(name) || [];
        if (entries.length === 0) {
          return { avgLatency: 0, successRate: 100, status: 'stable' as const };
        }

        // Calculate average latency
        const totalLatency = entries.reduce((sum, e) => sum + e.duration, 0);
        const avgLatency = Math.round(totalLatency / entries.length);

        // Calculate success rate
        const successful = entries.filter((e) => e.result.status === 'healthy').length;
        const successRate = Math.round((successful / entries.length) * 100);

        // Determine trend (compare recent half to older half)
        const mid = Math.floor(entries.length / 2);
        const recent = entries.slice(0, mid);
        const older = entries.slice(mid);

        const recentSuccessRate = recent.filter((e) => e.result.status === 'healthy').length / recent.length;
        const olderSuccessRate = older.filter((e) => e.result.status === 'healthy').length / older.length;

        let status: 'improving' | 'stable' | 'degrading';
        if (recentSuccessRate > olderSuccessRate + 0.1) {
          status = 'improving';
        } else if (recentSuccessRate < olderSuccessRate - 0.1) {
          status = 'degrading';
        } else {
          status = 'stable';
        }

        return { avgLatency, successRate, status };
      },
    };

    // Subscribe to check results
    kernel.on('check:completed', (data: unknown) => {
      const eventData = data as { name: string; result: CheckResult; duration: number };
      const entry: HistoryEntry = {
        name: eventData.name,
        result: eventData.result,
        timestamp: new Date().toISOString(),
        duration: eventData.duration,
      };

      // Add to overall history
      history.overall.push(entry);
      if (history.overall.length > DEFAULT_MAX_ENTRIES) {
        history.overall.shift();
      }

      // Add to per-check history
      const checkHistory = history.perCheck.get(eventData.name) || [];
      checkHistory.push(entry);
      if (checkHistory.length > DEFAULT_MAX_PER_CHECK) {
        checkHistory.shift();
      }
      history.perCheck.set(eventData.name, checkHistory);
    });

    kernel.emit('history:installed', { maxEntries: DEFAULT_MAX_ENTRIES, maxPerCheck: DEFAULT_MAX_PER_CHECK });
  },

  onInit(context) {
    context.logger.info('History plugin initialized');
  },
};

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create a history plugin instance with custom options.
 *
 * @example
 * ```typescript
 * const myHistoryPlugin = historyPluginWithOptions({
 *   maxEntries: 200,
 *   maxPerCheck: 100
 * });
 * kernel.use(myHistoryPlugin);
 * ```
 */
export function historyPluginWithOptions(options: {
  maxEntries?: number;
  maxPerCheck?: number;
}): Plugin<HealthContext> {
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const maxPerCheck = options.maxPerCheck ?? DEFAULT_MAX_PER_CHECK;

  return {
    name: 'history',
    version: '1.0.0',
    dependencies: ['runner'],

    install(kernel) {
      const context = kernel.getContext() as HistoryContext;

      const history: CheckHistory = {
        overall: [],
        perCheck: new Map(),
      };

      context.history = {
        getHistory: () => history,
        getCheckHistory: (name: string) => history.perCheck.get(name) || [],
        getOverallHistory: () => history.overall,
        clearHistory: () => {
          history.overall = [];
          history.perCheck.clear();
        },
        clearCheckHistory: (name: string) => {
          history.perCheck.delete(name);
        },
        getTrends: (name: string) => {
          const entries = history.perCheck.get(name) || [];
          if (entries.length === 0) {
            return { avgLatency: 0, successRate: 100, status: 'stable' as const };
          }

          const totalLatency = entries.reduce((sum, e) => sum + e.duration, 0);
          const avgLatency = Math.round(totalLatency / entries.length);

          const successful = entries.filter((e) => e.result.status === 'healthy').length;
          const successRate = Math.round((successful / entries.length) * 100);

          const mid = Math.floor(entries.length / 2);
          const recent = entries.slice(0, mid);
          const older = entries.slice(mid);

          const recentSuccessRate = recent.filter((e) => e.result.status === 'healthy').length / recent.length;
          const olderSuccessRate = older.filter((e) => e.result.status === 'healthy').length / older.length;

          let status: 'improving' | 'stable' | 'degrading';
          if (recentSuccessRate > olderSuccessRate + 0.1) {
            status = 'improving';
          } else if (recentSuccessRate < olderSuccessRate - 0.1) {
            status = 'degrading';
          } else {
            status = 'stable';
          }

          return { avgLatency, successRate, status };
        },
      };

      kernel.on('check:completed', (data: unknown) => {
        const eventData = data as { name: string; result: CheckResult; duration: number };
        const entry: HistoryEntry = {
          name: eventData.name,
          result: eventData.result,
          timestamp: new Date().toISOString(),
          duration: eventData.duration,
        };

        history.overall.push(entry);
        if (history.overall.length > maxEntries) {
          history.overall.shift();
        }

        const checkHistory = history.perCheck.get(eventData.name) || [];
        checkHistory.push(entry);
        if (checkHistory.length > maxPerCheck) {
          checkHistory.shift();
        }
        history.perCheck.set(eventData.name, checkHistory);
      });
    },
  };
}

// ============================================================================
// Exports
// ============================================================================
