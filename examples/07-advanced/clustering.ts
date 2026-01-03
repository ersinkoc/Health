/**
 * @oxog/health - Multi-Process Example
 *
 * Run health checks across multiple processes.
 */

import { health } from '@oxog/health';
import cluster from 'cluster';
import os from 'os';

const NUM_WORKERS = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} starting`);

  // Fork workers
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down workers...');
    for (const id in cluster.workers) {
      cluster.workers[id]?.kill();
    }
    process.exit(0);
  });
} else {
  // Worker process runs health server
  const server = await health.serve({
    port: 9000,
    checks: {
      database: async () => ({ status: 'healthy', latency: 5 }),
      redis: async () => ({ status: 'healthy', latency: 2 }),
    },
  });

  console.log(`Worker ${process.pid} running on port ${server.port}`);
}
