/**
 * @oxog/health - With Checks Example
 *
 * Add custom health checks for your dependencies.
 */

import { health } from '@oxog/health';

// Mock database connection
const db = {
  ping: async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return true;
  },
};

// Mock Redis connection
const redis = {
  ping: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2));
    return true;
  },
};

async function main() {
  const server = await health.serve({
    port: 9000,
    host: '0.0.0.0',
    checks: {
      // Simple function check
      database: async () => {
        await db.ping();
        return { status: 'healthy', latency: 5 };
      },

      // Object config with options
      redis: {
        handler: async () => {
          await redis.ping();
          return { status: 'healthy', latency: 2 };
        },
        timeout: 3000,
        retries: 2,
        critical: true,
        weight: 50,
      },
    },
    thresholds: {
      healthy: 80,
      degraded: 50,
    },
  });

  console.log(`Server running at http://0.0.0.0:${server.port}`);
  console.log('\nRegistered checks:');
  server.list().forEach((name) => {
    console.log(`  - ${name}`);
  });

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
