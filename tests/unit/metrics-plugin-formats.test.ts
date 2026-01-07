/**
 * @oxog/health - Metrics Plugin Format Methods Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { metricsPluginWithOptions } from '../../src/plugins/optional/metrics.js';
import type { HealthStatus } from '../../src/types.js';

describe('Metrics Plugin Format Methods', () => {
  it('should format metrics as Prometheus via plugin', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(metricsPluginWithOptions({ prefix: 'test_' }));

    await kernel.init();

    const context = kernel.getContext();

    const status: HealthStatus = {
      status: 'healthy',
      score: 100,
      uptime: 60,
      checks: {
        db: { status: 'healthy', latency: 10, lastCheck: new Date().toISOString() },
      },
    };

    // This triggers metrics.ts line 163-164
    const prometheus = context.metrics.formatPrometheus(status);

    expect(prometheus).toContain('health_check_status');
    expect(prometheus).toContain('health_score');

    await kernel.destroy();
  });

  it('should format metrics as JSON via plugin', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(metricsPluginWithOptions({ prefix: 'app_' }));

    await kernel.init();

    const context = kernel.getContext();

    const status: HealthStatus = {
      status: 'degraded',
      score: 75,
      uptime: 120,
      checks: {
        cache: { status: 'degraded', latency: 50, lastCheck: new Date().toISOString() },
      },
    };

    // This triggers metrics.ts line 167-168
    const json = context.metrics.formatJson(status);

    expect(json).toBeDefined();
    expect(json.status).toBe('degraded');
    expect(json.score).toBe(75);

    await kernel.destroy();
  });
});
