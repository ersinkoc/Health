/**
 * @oxog/health - Custom Check Logic Example
 *
 * Health checks with custom logic and metadata.
 */

import { health } from '@oxog/health';

interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
}

function getMemoryUsage(): MemoryUsage {
  if (typeof process === 'undefined') {
    return { heapUsed: 0, heapTotal: 0, external: 0 };
  }
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
  };
}

async function checkMemory(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  metadata: Record<string, unknown>;
}> {
  const start = Date.now();
  const memory = getMemoryUsage();
  const totalMemory = memory.heapTotal;
  const usedMemory = memory.heapUsed;
  const usagePercent = (usedMemory / totalMemory) * 100;

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (usagePercent < 80) {
    status = 'healthy';
  } else if (usagePercent < 90) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    latency: Date.now() - start,
    metadata: {
      heapUsed: `${Math.round(usedMemory / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(totalMemory / 1024 / 1024)}MB`,
      usagePercent: Math.round(usagePercent),
    },
  };
}

async function checkDiskSpace(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  metadata: Record<string, unknown>;
}> {
  // Mock disk space check
  const freeSpace = 50000000000; // 50GB
  const totalSpace = 100000000000; // 100GB
  const usagePercent = ((totalSpace - freeSpace) / totalSpace) * 100;

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (usagePercent < 80) {
    status = 'healthy';
  } else if (usagePercent < 90) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    latency: 5,
    metadata: {
      freeSpace: `${Math.round(freeSpace / 1024 / 1024 / 1024)}GB`,
      totalSpace: `${Math.round(totalSpace / 1024 / 1024 / 1024)}GB`,
      usagePercent: Math.round(usagePercent),
    },
  };
}

async function main() {
  const server = await health.serve({
    port: 9000,
    checks: {
      memory: {
        handler: checkMemory,
        critical: false,
        weight: 30,
      },
      disk: {
        handler: checkDiskSpace,
        critical: false,
        weight: 20,
      },
    },
    thresholds: {
      healthy: 80,
      degraded: 50,
    },
  });

  console.log(`Custom health server running on port ${server.port}`);

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
