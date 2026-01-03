/**
 * @oxog/health - Redis Check Example
 *
 * Health check for Redis.
 */

import { health } from '@oxog/health';

// Mock Redis client
const redis = {
  connected: true,
  ping: async () => {
    if (!redis.connected) throw new Error('Not connected');
    return 'PONG';
  },
  info: async () => {
    return {
      used_memory: 1048576,
      connected_clients: 5,
      uptime_in_seconds: 3600,
    };
  },
};

async function checkRedis(): Promise<{ status: 'healthy' | 'unhealthy' | 'degraded'; latency: number }> {
  const start = Date.now();
  try {
    await redis.ping();
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', latency: Date.now() - start };
  }
}

async function main() {
  const server = await health.serve({
    port: 9000,
    checks: {
      redis: {
        handler: checkRedis,
        critical: true,
        timeout: 3000,
      },
    },
  });

  console.log(`Redis health server running on port ${server.port}`);

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
