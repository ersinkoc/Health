import { CodeBlock } from '@/components/code/CodeBlock';
import { InstallTabs } from '@/components/common/InstallTabs';

const basicUsage = `import { health } from '@oxog/health';

// Start health server
const server = await health.serve({
  port: 9000,
  host: '0.0.0.0',
  checks: {
    database: async () => {
      await db.ping();
      return { status: 'healthy', latency: 5 };
    },
  },
});

// Server exposes:
// GET /health - Full health status
// GET /ready  - Kubernetes readiness probe
// GET /live   - Kubernetes liveness probe
// GET /metrics - Prometheus/JSON metrics

await server.close(); // Graceful shutdown`;

export function Introduction() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Introduction</h1>

      <p className="lead">
        <code>@oxog/health</code> is a zero-dependency health check server for
        Node.js applications. It provides HTTP health endpoints, Kubernetes-compatible
        probes, customizable dependency checks, and Prometheus metrics.
      </p>

      <h2>Installation</h2>
      <InstallTabs />

      <h2>Quick Start</h2>
      <p>
        The simplest way to get started is to use the <code>health.serve()</code>
        function to create a health server:
      </p>

      <CodeBlock code={basicUsage} language="typescript" title="server.ts" />

      <h2>Key Features</h2>
      <ul>
        <li>
          <strong>Zero Dependencies</strong> - Built entirely with Node.js built-in
          modules
        </li>
        <li>
          <strong>Kubernetes Ready</strong> - Native liveness and readiness probes
        </li>
        <li>
          <strong>Prometheus Metrics</strong> - Built-in metrics exposure
        </li>
        <li>
          <strong>Health Scoring</strong> - Weighted health scores with thresholds
        </li>
        <li>
          <strong>Plugin System</strong> - Extensible micro-kernel architecture
        </li>
        <li>
          <strong>CLI Interface</strong> - Command-line tools included
        </li>
      </ul>

      <h2>Requirements</h2>
      <ul>
        <li>Node.js 18 or higher</li>
        <li>TypeScript 5.0 or higher (for TypeScript users)</li>
      </ul>
    </div>
  );
}
