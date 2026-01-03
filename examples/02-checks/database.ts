/**
 * @oxog/health - Database Check Example
 *
 * Health check for a PostgreSQL database.
 */

import { health } from '@oxog/health';

// Mock PostgreSQL client
const pgClient = {
  query: async (sql: string) => {
    if (sql === 'SELECT 1') {
      return { rows: [{ '?column?': 1 }] };
    }
    throw new Error('Query failed');
  },
  end: async () => {},
};

async function checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; metadata?: Record<string, unknown> }> {
  const start = Date.now();
  try {
    await pgClient.query('SELECT 1');
    return {
      status: 'healthy',
      latency: Date.now() - start,
      metadata: { poolSize: 10, idleConnections: 5 },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - start,
      error: (error as Error).message,
    };
  }
}

async function main() {
  const server = await health.serve({
    port: 9000,
    checks: {
      database: checkDatabase,
    },
  });

  console.log(`Database health server running on port ${server.port}`);

  process.on('SIGINT', async () => {
    await pgClient.end();
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
