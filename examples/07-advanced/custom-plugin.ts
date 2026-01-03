/**
 * @oxog/health - Custom Plugin Example
 *
 * Create custom plugins to extend functionality.
 */

import { health, httpPlugin, runnerPlugin, aggregatorPlugin } from '@oxog/health';
import type { Plugin, HealthContext, HealthStatus } from '@oxog/health';

// Custom notification plugin
const notificationPlugin: Plugin<HealthContext> = {
  name: 'notification',
  version: '1.0.0',
  dependencies: ['aggregator'],

  install(kernel) {
    kernel.on('status:changed', (newStatus: HealthStatus) => {
      if (newStatus.status === 'unhealthy') {
        console.log('ALERT: Service is unhealthy!');
        // In real usage, send to Slack, PagerDuty, etc.
      }
    });
  },
};

// Custom metrics exporter plugin
const metricsExporterPlugin: Plugin<HealthContext> = {
  name: 'metrics-exporter',
  version: '1.0.0',
  dependencies: ['http'],

  install(kernel) {
    kernel.on('http:route', ({ basePath }: { basePath: string }) => {
      kernel.on(`request:${basePath}custom-metrics`, async (_req: unknown, res: unknown) => {
        const context = kernel.getContext();
        const status = await context.aggregator.aggregate(context.results, process.uptime());

        // Export custom metrics format
        const customMetrics = {
          score: status.score,
          status: status.status,
          checks: Object.keys(status.checks).length,
        };

        // In real usage, handle response properly
        console.log('Custom metrics:', customMetrics);
      });
    });
  },
};

async function main() {
  // Create kernel with custom plugins
  const kernel = health.create({ port: 9000 });
  kernel.use(httpPlugin);
  kernel.use(runnerPlugin);
  kernel.use(aggregatorPlugin);
  kernel.use(notificationPlugin);
  kernel.use(metricsExporterPlugin);

  await kernel.init();

  console.log('Custom plugin server running on port 9000');

  process.on('SIGINT', async () => {
    await kernel.destroy();
    process.exit(0);
  });
}

main().catch(console.error);
