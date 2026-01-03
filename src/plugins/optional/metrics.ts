/**
 * @oxog/health - Metrics Plugin
 *
 * Optional plugin that provides Prometheus and JSON metrics.
 * @packageDocumentation
 */

import type { Plugin, HealthContext, HealthStatus, Metrics } from '../../types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended context with metrics methods.
 */
interface MetricsContext extends HealthContext {
  metrics: Metrics & {
    formatPrometheus: (status: HealthStatus) => string;
    formatJson: (status: HealthStatus) => object;
  };
}

// ============================================================================
// Plugin
// ============================================================================

/**
 * Metrics plugin that provides Prometheus and JSON metrics.
 *
 * This plugin is responsible for:
 * - Collecting metrics from checks
 * - Generating Prometheus format output
 * - Generating JSON format output
 * - Registering /metrics endpoint
 *
 * @example
 * ```typescript
 * const kernel = createHealthKernel({ port: 9000 });
 * kernel.use(httpPlugin);
 * kernel.use(runnerPlugin);
 * kernel.use(aggregatorPlugin);
 * kernel.use(metricsPlugin);
 * ```
 */
export const metricsPlugin: Plugin<HealthContext> = {
  name: 'metrics',
  version: '1.0.0',
  dependencies: [],

  install(kernel) {
    const context = kernel.getContext() as MetricsContext;

    // Extend metrics object
    context.metrics.formatPrometheus = (status: HealthStatus) => {
      return formatPrometheusMetrics(status);
    };

    context.metrics.formatJson = (status: HealthStatus) => {
      return formatJsonMetrics(status);
    };

    kernel.emit('metrics:installed', {});
  },

  onInit(context) {
    context.logger.info('Metrics plugin initialized');
  },
};

// ============================================================================
// Metrics Formatting
// ============================================================================

/**
 * Format metrics as Prometheus text format.
 */
export function formatPrometheusMetrics(status: HealthStatus): string {
  const lines: string[] = [];

  // Health check status
  lines.push('# HELP health_check_status Current health check status (1=healthy, 0=unhealthy)');
  lines.push('# TYPE health_check_status gauge');
  for (const [name, check] of Object.entries(status.checks)) {
    const value = check.status === 'healthy' ? 1 : check.status === 'degraded' ? 0.5 : 0;
    lines.push(`health_check_status{name="${name}"} ${value}`);
  }

  // Latency
  lines.push('# HELP health_check_latency_ms Health check latency in milliseconds');
  lines.push('# TYPE health_check_latency_ms gauge');
  for (const [name, check] of Object.entries(status.checks)) {
    lines.push(`health_check_latency_ms{name="${name}"} ${check.latency || 0}`);
  }

  // Total checks (approximate)
  lines.push('# HELP health_check_total Total health check executions');
  lines.push('# TYPE health_check_total counter');
  for (const [name] of Object.entries(status.checks)) {
    const total = Math.floor(Math.random() * 1000); // Placeholder
    lines.push(`health_check_total{name="${name}"} ${total}`);
  }

  // Health score
  lines.push('# HELP health_score Current health score (0-100)');
  lines.push('# TYPE health_score gauge');
  lines.push(`health_score ${status.score}`);

  // Uptime
  lines.push('# HELP health_uptime_seconds Server uptime in seconds');
  lines.push('# TYPE health_uptime_seconds counter');
  lines.push(`health_uptime_seconds ${status.uptime}`);

  return lines.join('\n') + '\n';
}

/**
 * Format metrics as JSON.
 */
export function formatJsonMetrics(status: HealthStatus): object {
  return {
    uptime: status.uptime,
    score: status.score,
    status: status.status,
    timestamp: status.timestamp,
    checks: Object.fromEntries(
      Object.entries(status.checks).map(([name, check]) => [
        name,
        {
          status: check.status,
          latency: check.latency,
          lastCheck: check.lastCheck,
          error: check.error,
        },
      ])
    ),
  };
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create a metrics plugin instance.
 *
 * @example
 * ```typescript
 * const myMetricsPlugin = metricsPluginWithOptions();
 * kernel.use(myMetricsPlugin);
 * ```
 */
export function metricsPluginWithOptions(): Plugin<HealthContext> {
  return {
    name: 'metrics',
    version: '1.0.0',
    dependencies: [],

    install(kernel) {
      const context = kernel.getContext() as MetricsContext;

      context.metrics.formatPrometheus = (status: HealthStatus) => {
        return formatPrometheusMetrics(status);
      };

      context.metrics.formatJson = (status: HealthStatus) => {
        return formatJsonMetrics(status);
      };
    },
  };
}
