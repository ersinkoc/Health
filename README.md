# @oxog/health

> Zero-dependency health check server with Kubernetes-compatible probes and metrics exposure

[![npm version](https://img.shields.io/npm/v/@oxog/health.svg)](https://npmjs.com/package/@oxog/health)
[![License](https://img.shields.io/npm/l/@oxog/health.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/coverage-98%25-brightgreen.svg)](https://github.com/oxog/health)
[![Tests](https://img.shields.io/badge/tests-741%20passed-brightgreen.svg)](https://github.com/oxog/health)

## Features

- **Zero Dependencies** - Built entirely from scratch using only Node.js built-in modules
- **Kubernetes Probes** - Native support for liveness and readiness probes
- **Prometheus Metrics** - Built-in metrics at `/metrics` endpoint
- **Health Scoring** - Weighted scoring with configurable thresholds
- **Plugin Architecture** - Extensible micro-kernel design
- **TypeScript** - 100% TypeScript with strict mode
- **CLI Interface** - Command-line tools for serving and checking
- **98%+ Test Coverage** - Comprehensive test suite with 741 tests

## Install

```bash
npm install @oxog/health
```

## Quick Start

```typescript
import { health } from '@oxog/health';

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

console.log(`Server running on http://0.0.0.0:${server.port}`);
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Full health status with all checks |
| `GET /ready` | Kubernetes readiness probe |
| `GET /live` | Kubernetes liveness probe |
| `GET /metrics` | Prometheus/JSON metrics |

## Configuration

```typescript
interface ServeOptions {
  port: number;                    // Server port (default: 9000)
  host?: string;                   // Bind host (default: 0.0.0.0)
  basePath?: string;               // Base path for endpoints
  timeout?: number;                // Check timeout in ms (default: 5000)
  retries?: number;                // Retry attempts (default: 2)
  interval?: string | number;      // Check interval (default: 30s)
  checks?: Record<string, CheckConfig>; // Health checks
  thresholds?: ThresholdConfig;    // Score thresholds
}
```

## CLI Usage

```bash
# Start server
npx @oxog/health serve --port 9000

# Check remote endpoint
npx @oxog/health check http://localhost:9000/health --format json

# Exit codes: 0=healthy, 1=degraded, 2=unhealthy, 3=error
```

## Documentation

- [Documentation](https://health.oxog.dev)
- [Examples](examples/)
- [API Reference](https://health.oxog.dev/api)
- [Plugin Guide](https://health.oxog.dev/plugins)

## License

MIT License - see [LICENSE](LICENSE) for details.
