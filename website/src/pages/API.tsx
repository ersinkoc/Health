import { CodeBlock } from '@/components/code/CodeBlock';
import { cn } from '@/lib/utils';

const healthServe = `const server = await health.serve({
  port: 9000,
  host: '0.0.0.0',
  timeout: 5000,
  retries: 2,
  interval: '30s',
  checks: {
    database: async () => db.ping(),
  },
  thresholds: {
    healthy: 80,
    degraded: 50,
  },
});`;

const healthCheck = `const result = await health.check({
  database: () => db.ping(),
  redis: () => redis.ping(),
});

// Result:
// {
//   healthy: true,
//   score: 100,
//   checks: {
//     database: { status: 'healthy', latency: 5 },
//     redis: { status: 'healthy', latency: 2 },
//   }
// }`;

const serverMethods = `// Register a new check
server.register('api', async () => {
  const res = await fetch('https://api.example.com/health');
  return res.ok;
});

// Unregister a check
server.unregister('api');

// List all checks
const checks = server.list(); // ['database', 'redis']

// Get current status
const status = await server.status();

// Close server gracefully
await server.close();`;

interface APIItemProps {
  name: string;
  signature: string;
  description: string;
  params?: Array<{ name: string; type: string; description: string }>;
  returns?: string;
}

function APIItem({ name, signature, description, params, returns }: APIItemProps) {
  return (
    <div className="border-b border-[hsl(var(--border))] pb-8 mb-8 last:border-0">
      <h3 className="text-xl font-semibold mb-2">{name}</h3>
      <code className="block text-sm bg-[hsl(var(--muted))] px-3 py-2 rounded-lg mb-4 font-mono">
        {signature}
      </code>
      <p className="text-[hsl(var(--muted-foreground))] mb-4">{description}</p>

      {params && params.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Parameters</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {params.map((param) => (
                  <tr key={param.name} className="border-b border-[hsl(var(--border)/0.5)]">
                    <td className="py-2 pr-4 font-mono text-[hsl(var(--primary))]">
                      {param.name}
                    </td>
                    <td className="py-2 pr-4 font-mono text-[hsl(var(--muted-foreground))]">
                      {param.type}
                    </td>
                    <td className="py-2 text-[hsl(var(--muted-foreground))]">
                      {param.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {returns && (
        <div>
          <h4 className="font-medium mb-2">Returns</h4>
          <code className="text-sm text-[hsl(var(--muted-foreground))]">{returns}</code>
        </div>
      )}
    </div>
  );
}

export function API() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">API Reference</h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] mb-10">
          Complete API documentation for @oxog/health
        </p>

        {/* Main API */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-[hsl(var(--border))]">
            Main API
          </h2>

          <APIItem
            name="health.serve()"
            signature="health.serve(options: ServeOptions): Promise<HealthServer>"
            description="Start a health check server with the specified options."
            params={[
              { name: 'port', type: 'number', description: 'HTTP port to listen on' },
              { name: 'host', type: 'string', description: 'Host to bind to (default: 0.0.0.0)' },
              { name: 'timeout', type: 'number', description: 'Global timeout for checks in ms' },
              { name: 'retries', type: 'number', description: 'Global retry count' },
              { name: 'interval', type: 'string | number', description: 'Global check interval' },
              { name: 'checks', type: 'Record<string, CheckHandler | CheckConfig>', description: 'Health check definitions' },
              { name: 'thresholds', type: 'ThresholdConfig', description: 'Health score thresholds' },
            ]}
            returns="Promise<HealthServer>"
          />

          <CodeBlock code={healthServe} language="typescript" title="serve-example.ts" />

          <APIItem
            name="health.check()"
            signature="health.check(checks: Record<string, CheckHandler>): Promise<CheckResult>"
            description="Perform one-shot health checks without starting a server."
            params={[
              { name: 'checks', type: 'Record<string, CheckHandler>', description: 'Health check functions to execute' },
            ]}
            returns="Promise<CheckResult>"
          />

          <CodeBlock code={healthCheck} language="typescript" title="check-example.ts" />

          <APIItem
            name="health.checkRemote()"
            signature="health.checkRemote(url: string): Promise<RemoteHealthStatus>"
            description="Check a remote health endpoint and parse the response."
            params={[
              { name: 'url', type: 'string', description: 'URL of the remote health endpoint' },
            ]}
            returns="Promise<RemoteHealthStatus>"
          />

          <APIItem
            name="health.create()"
            signature="health.create(): HealthKernel"
            description="Create a custom kernel instance for advanced plugin configuration."
            returns="HealthKernel"
          />
        </section>

        {/* Server Methods */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-[hsl(var(--border))]">
            Server Methods
          </h2>

          <CodeBlock code={serverMethods} language="typescript" title="server-methods.ts" />

          <div className="space-y-6 mt-6">
            <div className={cn('p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]')}>
              <h4 className="font-semibold mb-1">server.register(name, check)</h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Register a new health check with the given name.
              </p>
            </div>
            <div className={cn('p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]')}>
              <h4 className="font-semibold mb-1">server.unregister(name)</h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Remove a health check by name. Returns true if found and removed.
              </p>
            </div>
            <div className={cn('p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]')}>
              <h4 className="font-semibold mb-1">server.list()</h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Get an array of all registered check names.
              </p>
            </div>
            <div className={cn('p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]')}>
              <h4 className="font-semibold mb-1">server.status()</h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Get the current health status with all check results.
              </p>
            </div>
            <div className={cn('p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]')}>
              <h4 className="font-semibold mb-1">server.close()</h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Gracefully shutdown the server and cleanup resources.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
