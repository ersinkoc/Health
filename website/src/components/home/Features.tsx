import {
  Package,
  Server,
  Activity,
  BarChart3,
  Puzzle,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Package,
    title: 'Zero Dependencies',
    description:
      'Built entirely from scratch using only Node.js built-in modules. No external dependencies to worry about.',
  },
  {
    icon: Server,
    title: 'Kubernetes Probes',
    description:
      'Native support for liveness and readiness probes that work seamlessly with Kubernetes deployments.',
  },
  {
    icon: BarChart3,
    title: 'Prometheus Metrics',
    description:
      'Built-in Prometheus-compatible metrics at /metrics endpoint with both text and JSON format support.',
  },
  {
    icon: Activity,
    title: 'Health Scoring',
    description:
      'Weighted health scoring with configurable thresholds for healthy, degraded, and unhealthy states.',
  },
  {
    icon: Puzzle,
    title: 'Plugin Architecture',
    description:
      'Extensible micro-kernel architecture with plugin support for custom functionality.',
  },
  {
    icon: Terminal,
    title: 'CLI Interface',
    description:
      'Command-line tools for serving health checks and checking remote endpoints.',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-[hsl(var(--muted)/0.3)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Features</h2>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Everything you need for production-ready health monitoring
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={cn(
                'p-6 rounded-xl',
                'border border-[hsl(var(--border))] bg-[hsl(var(--card))]',
                'hover:border-[hsl(var(--primary)/0.5)] transition-colors'
              )}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[hsl(var(--primary)/0.1)] mb-4">
                <feature.icon className="w-6 h-6 text-[hsl(var(--primary))]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
