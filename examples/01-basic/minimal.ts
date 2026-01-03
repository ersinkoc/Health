/**
 * @oxog/health - Minimal Example
 *
 * The simplest way to start a health check server.
 */

import { health } from '@oxog/health';

async function main() {
  // Start the health server on port 9000
  const server = await health.serve({
    port: 9000,
  });

  console.log(`Health server running at http://0.0.0.0:${server.port}`);
  console.log('Available endpoints:');
  console.log('  GET /health - Full health status');
  console.log('  GET /ready  - Readiness probe');
  console.log('  GET /live   - Liveness probe');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
