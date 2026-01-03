/**
 * @oxog/health - Health Scoring Example
 *
 * Configure weighted health scoring.
 */

import { health } from '@oxog/health';

async function main() {
  const server = await health.serve({
    port: 9000,
    checks: {
      // Primary database - high weight
      primaryDb: {
        handler: async () => ({ status: 'healthy', weight: 50 }),
        weight: 50,
      },
      // Secondary database - medium weight
      secondaryDb: {
        handler: async () => ({ status: 'healthy', weight: 30 }),
        weight: 30,
      },
      // Cache - lower weight
      cache: {
        handler: async () => ({ status: 'healthy', weight: 20 }),
        weight: 20,
      },
    },
    thresholds: {
      healthy: 80,   // Score >= 80 = healthy
      degraded: 50,  // Score >= 50 = degraded
    },
  });

  console.log(`Server running on port ${server.port}`);
  console.log('\nScoring breakdown:');
  console.log('- All healthy: 100% score = healthy');
  console.log('- Primary healthy, others unhealthy: 50% score = degraded');
  console.log('- Only cache healthy: 20% score = unhealthy');

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
