import { CodeBlock } from '@/components/code/CodeBlock';

const examples = [
  {
    category: 'Basic',
    items: [
      {
        title: 'Minimal Server',
        description: 'The simplest health server setup',
        code: `import { health } from '@oxog/health';

const server = await health.serve({ port: 9000 });
console.log(\`Health server running on port \${server.port}\`);`,
        language: 'typescript',
      },
      {
        title: 'With Multiple Checks',
        description: 'Register multiple health checks',
        code: `import { health } from '@oxog/health';

const server = await health.serve({
  port: 9000,
  checks: {
    database: async () => {
      await db.ping();
      return { status: 'healthy', latency: 5 };
    },
    redis: async () => {
      await redis.ping();
      return { status: 'healthy', latency: 2 };
    },
    api: async () => {
      const res = await fetch('https://api.example.com/health');
      if (!res.ok) throw new Error('API unhealthy');
      return { status: 'healthy' };
    },
  },
});`,
        language: 'typescript',
      },
    ],
  },
  {
    category: 'Kubernetes',
    items: [
      {
        title: 'Probe Configuration',
        description: 'Configure critical and non-critical checks for K8s',
        code: `import { health } from '@oxog/health';

const server = await health.serve({
  port: 9000,
  checks: {
    // Critical - failure = unready
    database: {
      handler: () => db.ping(),
      critical: true,
      timeout: 5000,
    },
    // Non-critical - failure = degraded
    cache: {
      handler: () => cache.ping(),
      critical: false,
      timeout: 2000,
    },
  },
});

// Kubernetes will use:
// /live - Always 200 if server responds
// /ready - 503 if critical checks fail`,
        language: 'typescript',
      },
      {
        title: 'Kubernetes Deployment',
        description: 'Example deployment.yaml configuration',
        code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: my-app:latest
          ports:
            - containerPort: 3000
            - containerPort: 9000  # Health port
          livenessProbe:
            httpGet:
              path: /live
              port: 9000
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 9000
            initialDelaySeconds: 10
            periodSeconds: 5`,
        language: 'yaml',
      },
    ],
  },
  {
    category: 'Health Scoring',
    items: [
      {
        title: 'Weighted Scoring',
        description: 'Configure weights and thresholds for health scoring',
        code: `import { health } from '@oxog/health';

const server = await health.serve({
  port: 9000,
  checks: {
    database: {
      handler: () => db.ping(),
      critical: true,
      weight: 50,  // 50% of total score
    },
    redis: {
      handler: () => redis.ping(),
      critical: false,
      weight: 30,  // 30% of total score
    },
    api: {
      handler: () => fetch(apiUrl),
      critical: false,
      weight: 20,  // 20% of total score
    },
  },
  thresholds: {
    healthy: 80,   // score >= 80 = healthy
    degraded: 50,  // score >= 50 = degraded
    // score < 50 = unhealthy
  },
});`,
        language: 'typescript',
      },
    ],
  },
  {
    category: 'CLI',
    items: [
      {
        title: 'CLI Commands',
        description: 'Using the command-line interface',
        code: `# Start health server
npx @oxog/health serve --port 9000

# Check remote endpoint
npx @oxog/health check http://localhost:9000/health

# Check with JSON output
npx @oxog/health check http://localhost:9000/health --format json

# Exit codes:
# 0 = healthy
# 1 = degraded
# 2 = unhealthy
# 3 = error`,
        language: 'bash',
      },
    ],
  },
];

export function Examples() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Examples</h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))] mb-10">
          Learn by example with these common use cases
        </p>

        {examples.map((section) => (
          <section key={section.category} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-[hsl(var(--border))]">
              {section.category}
            </h2>

            <div className="space-y-8">
              {section.items.map((example) => (
                <div key={example.title}>
                  <h3 className="text-xl font-semibold mb-2">{example.title}</h3>
                  <p className="text-[hsl(var(--muted-foreground))] mb-4">
                    {example.description}
                  </p>
                  <CodeBlock
                    code={example.code}
                    language={example.language}
                    title={`${example.title.toLowerCase().replace(/\s+/g, '-')}.${example.language === 'typescript' ? 'ts' : example.language}`}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
