import { cn } from '@/lib/utils';

const endpoints = [
  {
    method: 'GET',
    path: '/health',
    description: 'Full health status with all checks',
  },
  {
    method: 'GET',
    path: '/ready',
    description: 'Kubernetes readiness probe',
  },
  {
    method: 'GET',
    path: '/live',
    description: 'Kubernetes liveness probe',
  },
  {
    method: 'GET',
    path: '/metrics',
    description: 'Prometheus/JSON metrics',
  },
];

export function Endpoints() {
  return (
    <section className="py-20 bg-[hsl(var(--muted)/0.3)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Endpoints</h2>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Kubernetes-compatible endpoints out of the box
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.path}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl',
                'border border-[hsl(var(--border))] bg-[hsl(var(--card))]'
              )}
            >
              <span className="px-3 py-1 rounded-md bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-mono text-sm font-medium">
                {endpoint.method}
              </span>
              <div className="flex-1">
                <div className="font-mono font-medium">{endpoint.path}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                  {endpoint.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
