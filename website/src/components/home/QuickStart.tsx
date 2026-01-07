import { CodeBlock } from '@/components/code/CodeBlock';

const basicExample = `import { health } from '@oxog/health';

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
  },
});

console.log(\`Server running on port \${server.port}\`);`;

export function QuickStart() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Quick Start</h2>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Get up and running in seconds with a simple API
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <CodeBlock
            code={basicExample}
            language="typescript"
            title="server.ts"
          />
        </div>
      </div>
    </section>
  );
}
