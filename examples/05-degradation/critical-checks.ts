/**
 * @oxog/health - Critical vs Non-Critical Checks
 *
 * Use critical flag to mark essential dependencies.
 */

import { health } from '@oxog/health';

async function main() {
  const server = await health.serve({
    port: 9000,
    checks: {
      // Critical check - failure marks entire service unhealthy
      database: {
        handler: async () => {
          // Database connection check
          return { status: 'healthy', latency: 5 };
        },
        critical: true,
        weight: 60,
      },
      // Non-critical check - failure only affects health score
      redis: {
        handler: async () => {
          // Redis is for caching, optional
          return { status: 'healthy', latency: 2 };
        },
        critical: false,
        weight: 20,
      },
      // Optional external API
      analytics: {
        handler: async () => {
          // Analytics API, nice to have
          return { status: 'healthy', latency: 100 };
        },
        critical: false,
        weight: 20,
      },
    },
    thresholds: {
      healthy: 80,
      degraded: 50,
    },
  });

  console.log(`Server running on port ${server.port}`);
  console.log('\nHealth status behavior:');
  console.log('- If database fails: status = unhealthy (critical)');
  console.log('- If Redis fails: status = degraded (non-critical)');
  console.log('- If all pass: status = healthy');

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
