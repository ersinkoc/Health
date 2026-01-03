/**
 * @oxog/health - HTTP API Check Example
 *
 * Health check for external HTTP APIs.
 */

import { health } from '@oxog/health';

interface ApiResponse {
  status: number;
  data?: { status: string };
}

async function checkPaymentApi(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }> {
  const start = Date.now();
  try {
    // In real usage, use fetch
    // const response = await fetch('https://api.payment.com/health');

    // Mock response
    const response: ApiResponse = { status: 200, data: { status: 'ok' } };

    if (response.status === 200) {
      return { status: 'healthy', latency: Date.now() - start };
    }
    return { status: 'unhealthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', latency: Date.now() - start, error: (error as Error).message };
  }
}

async function main() {
  const server = await health.serve({
    port: 9000,
    checks: {
      paymentApi: {
        handler: checkPaymentApi,
        timeout: 10000,
        critical: true,
      },
    },
  });

  console.log(`API health server running on port ${server.port}`);

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch(console.error);
