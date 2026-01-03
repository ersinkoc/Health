/**
 * @oxog/health - Prometheus Metrics Example
 *
 * Expose Prometheus-compatible metrics.
 */

import { health } from '@oxog/health';

async function main() {
  const server = await health.serve({
    port: 9000,
    checks: {
      database: async () => ({ status: 'healthy', latency: 5 }),
      redis: async () => ({ status: 'healthy', latency: 2 }),
      api: async () => ({ status: 'healthy', latency: 150 }),
    },
  });

  console.log(`Metrics server running on port ${server.port}`);
  console.log('\nEndpoints:');
  console.log('  GET /metrics - Prometheus metrics (text/plain)');
  console.log('  GET /metrics - JSON metrics (application/json)');

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
