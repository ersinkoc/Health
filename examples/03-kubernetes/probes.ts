/**
 * @oxog/health - Kubernetes Probes Example
 *
 * Configure health checks for Kubernetes probes.
 */

import { health } from '@oxog/health';

async function main() {
  const server = await health.serve({
    port: 9000,
    host: '0.0.0.0',
    basePath: '/',
    checks: {
      database: {
        handler: async () => {
          // Your database check logic
          return { status: 'healthy', latency: 5 };
        },
        critical: true,
        weight: 60,
      },
      redis: {
        handler: async () => {
          // Your Redis check logic
          return { status: 'healthy', latency: 2 };
        },
        critical: false,
        weight: 40,
      },
    },
    thresholds: {
      healthy: 80,
      degraded: 50,
    },
  });

  console.log(`Kubernetes health server running on port ${server.port}`);
  console.log('\nKubernetes Deployment Configuration:');
  console.log('```yaml');
  console.log('livenessProbe:');
  console.log('  httpGet:');
  console.log('    path: /live');
  console.log(`    port: ${server.port}`);
  console.log('  initialDelaySeconds: 5');
  console.log('  periodSeconds: 10');
  console.log('  timeoutSeconds: 3');
  console.log('  failureThreshold: 3');
  console.log('');
  console.log('readinessProbe:');
  console.log('  httpGet:');
  console.log('    path: /ready');
  console.log(`    port: ${server.port}`);
  console.log('  initialDelaySeconds: 10');
  console.log('  periodSeconds: 5');
  console.log('  timeoutSeconds: 3');
  console.log('  failureThreshold: 3');
  console.log('```');

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
