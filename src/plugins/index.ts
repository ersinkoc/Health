/**
 * @oxog/health - Plugins Index
 *
 * Export all plugins for easy importing.
 * @packageDocumentation
 */

// Core Plugins
export { httpPlugin, httpPluginWithOptions } from './core/http.js';
export { runnerPlugin, runnerPluginWithOptions } from './core/runner.js';
export { aggregatorPlugin, aggregatorPluginWithOptions } from './core/aggregator.js';

// Optional Plugins
export { metricsPlugin, metricsPluginWithOptions } from './optional/metrics.js';
export {
  cliPlugin,
  cliPluginWithOptions,
  parseArgs,
  serveCommand,
  checkCommand,
  displayHelp,
  displayVersion,
  main,
} from './optional/cli.js';
export { thresholdsPlugin, thresholdsPluginWithOptions, isValidThreshold } from './optional/thresholds.js';
export { historyPlugin, historyPluginWithOptions } from './optional/history.js';

// Types
export type { Plugin } from '../types.js';
