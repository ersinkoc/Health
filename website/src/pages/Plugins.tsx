import { CodeBlock } from '@/components/code/CodeBlock';
import { cn } from '@/lib/utils';
import { Check, Puzzle } from 'lucide-react';

const corePlugins = [
  {
    name: 'http',
    description: 'Zero-dependency HTTP server for health endpoints',
    auto: true,
  },
  {
    name: 'runner',
    description: 'Check execution engine with timeout, retry, and parallel execution',
    auto: true,
  },
  {
    name: 'aggregator',
    description: 'Status aggregation, health scoring, and degradation logic',
    auto: true,
  },
];

const optionalPlugins = [
  {
    name: 'metrics',
    description: 'Prometheus + JSON metrics at /metrics endpoint',
    usage: "kernel.use(metricsPlugin)",
  },
  {
    name: 'cli',
    description: 'CLI commands (serve, check) with argument parsing',
    usage: "kernel.use(cliPlugin)",
  },
  {
    name: 'thresholds',
    description: 'Configurable warning/critical thresholds',
    usage: "kernel.use(thresholdsPlugin)",
  },
  {
    name: 'history',
    description: 'Check history retention for trends and analysis',
    usage: "kernel.use(historyPlugin)",
  },
];

const customPluginExample = `import { health } from '@oxog/health';
import type { Plugin, HealthContext } from '@oxog/health';

// Define a custom plugin
const loggingPlugin: Plugin<HealthContext> = {
  name: 'logging',
  version: '1.0.0',
  dependencies: ['runner'], // Depends on runner plugin

  install(kernel) {
    // Access kernel features
    const runner = kernel.getPlugin('runner');

    // Register event handlers
    kernel.on('check:start', (name) => {
      console.log(\`[LOG] Check started: \${name}\`);
    });

    kernel.on('check:complete', (name, result) => {
      console.log(\`[LOG] Check completed: \${name} - \${result.status}\`);
    });
  },

  onInit(context) {
    console.log('[LOG] Logging plugin initialized');
  },

  onDestroy() {
    console.log('[LOG] Logging plugin destroyed');
  },

  onError(error) {
    console.error('[LOG] Plugin error:', error);
  },
};

// Use the custom plugin
const kernel = health.create();
kernel.use(loggingPlugin);
await kernel.init();`;

export function Plugins() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Plugins</h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] mb-10">
          Extend functionality with the micro-kernel plugin system
        </p>

        {/* Architecture */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-[hsl(var(--border))]">
            Architecture
          </h2>
          <div className={cn(
            'p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]',
            'font-mono text-sm overflow-x-auto'
          )}>
            <pre className="text-[hsl(var(--muted-foreground))]">{`┌─────────────────────────────────────────────────┐
│                  User Code                       │
├─────────────────────────────────────────────────┤
│            Health Check Registry                 │
│  serve() · check() · register() · unregister()  │
├──────────┬──────────┬───────────┬───────────────┤
│   http   │  runner  │aggregator │   metrics     │
│  plugin  │  plugin  │  plugin   │   plugin      │
├──────────┴──────────┴───────────┴───────────────┤
│               Micro Kernel                       │
│    Check Registry · Event Bus · Error Handler   │
└─────────────────────────────────────────────────┘`}</pre>
          </div>
        </section>

        {/* Core Plugins */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-[hsl(var(--border))]">
            Core Plugins
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            These plugins are automatically loaded when using <code>health.serve()</code>
          </p>

          <div className="space-y-4">
            {corePlugins.map((plugin) => (
              <div
                key={plugin.name}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl',
                  'border border-[hsl(var(--border))] bg-[hsl(var(--card))]'
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[hsl(var(--primary)/0.1)]">
                  <Check className="w-5 h-5 text-[hsl(var(--primary))]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{plugin.name}</h3>
                    <span className="px-2 py-0.5 rounded text-xs bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                      Auto-loaded
                    </span>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {plugin.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Optional Plugins */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-[hsl(var(--border))]">
            Optional Plugins
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            Enable these plugins as needed for additional functionality
          </p>

          <div className="space-y-4">
            {optionalPlugins.map((plugin) => (
              <div
                key={plugin.name}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl',
                  'border border-[hsl(var(--border))] bg-[hsl(var(--card))]'
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[hsl(var(--muted))]">
                  <Puzzle className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{plugin.name}</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                    {plugin.description}
                  </p>
                  <code className="text-xs bg-[hsl(var(--muted))] px-2 py-1 rounded">
                    {plugin.usage}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Custom Plugins */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-[hsl(var(--border))]">
            Creating Custom Plugins
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            Create your own plugins to extend the health check system
          </p>

          <CodeBlock
            code={customPluginExample}
            language="typescript"
            title="custom-plugin.ts"
          />
        </section>
      </div>
    </div>
  );
}
