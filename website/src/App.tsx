import { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <div className="app">
      <header>
        <div className="container">
          <div className="logo">
            <span>@oxog/</span>
            <code>health</code>
          </div>
          <nav>
            <a href="#features">Features</a>
            <a href="#usage">Usage</a>
            <a href="#endpoints">Endpoints</a>
            <a href="#examples">Examples</a>
            <a href="https://github.com/ersinkoc/health" target="_blank" rel="noopener">GitHub</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <h1>
              Zero-Dependency <br />
              <code>Health Check Server</code>
            </h1>
            <p>
              Production-ready health checks with Kubernetes-compatible probes,
              Prometheus metrics, and graceful degradation. 100% TypeScript with zero runtime dependencies.
            </p>
            <div className="install">
              <code>npm install @oxog/health</code>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features">
          <div className="container">
            <h2>Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>Zero Dependencies</h3>
                <p>
                  Built entirely from scratch using only Node.js built-in modules.
                  No external dependencies to worry about.
                </p>
              </div>
              <div className="feature-card">
                <h3>Kubernetes Probes</h3>
                <p>
                  Native support for liveness and readiness probes that work
                  seamlessly with Kubernetes deployments.
                </p>
              </div>
              <div className="feature-card">
                <h3>Prometheus Metrics</h3>
                <p>
                  Built-in Prometheus-compatible metrics at /metrics endpoint
                  with both text and JSON format support.
                </p>
              </div>
              <div className="feature-card">
                <h3>Health Scoring</h3>
                <p>
                  Weighted health scoring with configurable thresholds for
                  healthy, degraded, and unhealthy states.
                </p>
              </div>
              <div className="feature-card">
                <h3>Plugin Architecture</h3>
                <p>
                  Extensible micro-kernel architecture with plugin support
                  for custom functionality.
                </p>
              </div>
              <div className="feature-card">
                <h3>CLI Interface</h3>
                <p>
                  Command-line tools for serving health checks and checking
                  remote endpoints.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Section */}
        <section id="usage" className="usage">
          <div className="container">
            <h2>Quick Start</h2>

            <div className="code-block">
              <div className="code-block-header">
                <span>basic.ts</span>
                <span>TypeScript</span>
              </div>
              <pre>
                <code>{`import { health } from '@oxog/health';

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

console.log(\`Server running on port \${server.port}\`);`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Endpoints Section */}
        <section id="endpoints" className="endpoints-section">
          <div className="container">
            <h2>Endpoints</h2>
            <div className="endpoints">
              <div className="endpoint">
                <span className="method">GET</span>
                <div>
                  <div className="path">/health</div>
                  <div className="description">Full health status with all checks</div>
                </div>
              </div>
              <div className="endpoint">
                <span className="method">GET</span>
                <div>
                  <div className="path">/ready</div>
                  <div className="description">Kubernetes readiness probe</div>
                </div>
              </div>
              <div className="endpoint">
                <span className="method">GET</span>
                <div>
                  <div className="path">/live</div>
                  <div className="description">Kubernetes liveness probe</div>
                </div>
              </div>
              <div className="endpoint">
                <span className="method">GET</span>
                <div>
                  <div className="path">/metrics</div>
                  <div className="description">Prometheus/JSON metrics</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="examples">
          <div className="container">
            <h2>Examples</h2>

            <div className="code-block">
              <div className="code-block-header">
                <span>checks.ts</span>
                <span>TypeScript</span>
              </div>
              <pre>
                <code>{`// Custom checks with timeout and retry
health.serve({
  port: 9000,
  checks: {
    database: {
      handler: () => db.ping(),
      timeout: 5000,
      retries: 3,
      critical: true,
      weight: 60,
    },
    redis: {
      handler: () => redis.ping(),
      timeout: 2000,
      retries: 2,
      critical: false,
      weight: 40,
    },
  },
  thresholds: {
    healthy: 80,
    degraded: 50,
  },
});`}</code>
              </pre>
            </div>

            <div className="code-block">
              <div className="code-block-header">
                <span>CLI</span>
                <span>Shell</span>
              </div>
              <pre>
                <code>{`# Start server
npx @oxog/health serve --port 9000

# Check remote endpoint
npx @oxog/health check http://localhost:9000/health --format json

# Exit codes: 0=healthy, 1=degraded, 2=unhealthy, 3=error`}</code>
              </pre>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="copyright">
            <code>@oxog/health</code> - MIT License
          </div>
          <div className="links">
            <a href="https://health.oxog.dev">Docs</a>
            <a href="https://github.com/ersinkoc/health">GitHub</a>
            <a href="https://npmjs.com/package/@oxog/health">NPM</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
