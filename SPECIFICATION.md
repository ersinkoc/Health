# @oxog/health Specification

## Overview

**@oxog/health** is a zero-dependency, production-ready health check library for Node.js applications. It provides HTTP health endpoints, Kubernetes-compatible liveness/readiness probes, customizable dependency checks, graceful degradation with health scoring, Prometheus-compatible metrics, and both CLI and programmatic interfaces.

## Package Identity

| Field | Value |
|-------|-------|
| **NPM Package** | `@oxog/health` |
| **GitHub Repository** | `https://github.com/ersinkoc/health` |
| **Documentation Site** | `https://health.oxog.dev` |
| **License** | MIT |
| **Author** | Ersin Koç (ersinkoc) |

## Non-Negotiable Rules

### 1. Zero Runtime Dependencies

```json
{
  "dependencies": {}
}
```

All functionality must be implemented from scratch using only Node.js built-in modules (`http`, `net`, `stream`, `events`, `util`, `buffer`).

**Allowed devDependencies:**
- `typescript: ^5.0.0`
- `vitest: ^2.0.0`
- `@vitest/coverage-v8: ^2.0.0`
- `tsup: ^8.0.0`
- `@types/node: ^20.0.0`
- `prettier: ^3.0.0`
- `eslint: ^9.0.0`

### 2. 100% Test Coverage

- Every line, branch, and function must be tested
- All tests must pass (100% success rate)
- Coverage thresholds enforced in Vitest config

### 3. Micro-Kernel Architecture

```
┌─────────────────────────────────────────────────┐
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
└─────────────────────────────────────────────────┘
```

### 4. TypeScript Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext"
  }
}
```

### 5. LLM-Native Design

- `llms.txt` file in root (< 2000 tokens)
- Predictable API naming (`create`, `get`, `set`, `use`, `remove`)
- Rich JSDoc with @example on every public API
- 15+ examples organized by category
- README optimized for LLM consumption

### 6. No External Links

**Allowed:**
- GitHub repository URL
- Custom domain (health.oxog.dev)
- npm package URL

**Not Allowed:**
- Social media (Twitter, LinkedIn, etc.)
- Discord/Slack links
- Email addresses
- Donation/sponsor links

## Core Features

### 1. HTTP Health Server

Zero-dependency HTTP server providing health check endpoints at `/health`, `/ready`, `/live`, and `/metrics`.

### 2. Health Checks with Timeout/Retry

Register custom health checks with configurable:
- Timeout (ms)
- Retry count
- Criticality (affects overall status)
- Weight (for health scoring)

### 3. Kubernetes Probes

- **Liveness Probe** (`GET /live`): Returns 200 if server is alive
- **Readiness Probe** (`GET /ready`): Returns 200 only if all critical checks pass
- **Full Health** (`GET /health`): Returns detailed status with all checks

### 4. Graceful Degradation & Health Scoring

- Health score (0-100) based on check weights
- Configurable thresholds:
  - `healthy`: score >= threshold (default: 80)
  - `degraded`: score >= threshold (default: 50)
  - `unhealthy`: score < degraded threshold

### 5. Prometheus & JSON Metrics

- Prometheus text format at `/metrics`
- JSON format available via Accept header
- Metrics: status, latency, total checks, health score, uptime

### 6. CLI Interface

```bash
npx @oxog/health serve --port 9000
npx @oxog/health check http://localhost:9000/health
```

Exit codes: 0=healthy, 1=degraded, 2=unhealthy, 3=error

### 7. Programmatic One-Shot Check

Run health checks without starting a server.

### 8. Configurable Intervals

Support for interval-based checking with string parsing:
- `'10s'` = 10 seconds
- `'5m'` = 5 minutes
- `'1h'` = 1 hour
- `30000` = 30 seconds (ms)

## Plugin System

### Core Plugins (Always Loaded)

| Plugin | Description |
|--------|-------------|
| `http` | Zero-dependency HTTP server for health endpoints |
| `runner` | Check execution engine with timeout, retry, parallel execution |
| `aggregator` | Status aggregation, health scoring, degradation logic |

### Optional Plugins (Opt-in)

| Plugin | Description | Enable |
|--------|-------------|--------|
| `metrics` | Prometheus + JSON metrics at /metrics | `kernel.use(metricsPlugin)` |
| `cli` | CLI commands (serve, check) with arg parsing | `kernel.use(cliPlugin)` |
| `thresholds` | Configurable warning/critical thresholds | `kernel.use(thresholdsPlugin)` |
| `history` | Check history retention for trends | `kernel.use(historyPlugin)` |

## API Reference

### Main Export

```typescript
import { health } from '@oxog/health';

// Start health server
const server = health.serve({
  port: 9000,
  host: '0.0.0.0',
  timeout: 5000,
  retries: 2,
  interval: '30s',
  checks: {
    database: async () => {
      await db.ping();
      return { status: 'healthy', latency: 5 };
    },
  },
});

// One-shot health check
const result = await health.check({
  database: () => db.ping(),
});

// Check remote endpoint
const remote = await health.checkRemote('http://localhost:9000/health');

// Create custom kernel
const kernel = health.create();
kernel.use(customPlugin);
```

### Types

```typescript
type CheckHandler = () => void | boolean | CheckResult | Promise<void | boolean | CheckResult>;

interface CheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

interface CheckConfig {
  handler: CheckHandler;
  timeout?: number;
  retries?: number;
  critical?: boolean;
  weight?: number;
  interval?: string | number;
}

interface ServeOptions {
  port: number;
  host?: string;
  basePath?: string;
  timeout?: number;
  retries?: number;
  interval?: string | number;
  checks?: Record<string, CheckHandler | CheckConfig>;
  thresholds?: ThresholdConfig;
}

interface HealthServer {
  readonly port: number;
  readonly startTime: Date;
  register(name: string, check: CheckHandler | CheckConfig): void;
  unregister(name: string): boolean;
  list(): string[];
  status(): Promise<HealthStatus>;
  close(): Promise<void>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  uptime: number;
  timestamp: string;
  checks: Record<string, CheckStatus>;
}

interface CheckStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency: number;
  lastCheck: string;
  error?: string;
  metadata?: Record<string, unknown>;
}
```

## Technical Requirements

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js >= 18 |
| Module Format | ESM + CJS (dual package) |
| TypeScript Version | >= 5.0 |
| Bundle Size (core) | < 5KB gzipped |
| Bundle Size (all plugins) | < 15KB gzipped |

## Project Structure

```
health/
├── .github/workflows/deploy.yml
├── src/
│   ├── index.ts
│   ├── kernel.ts
│   ├── types.ts
│   ├── errors.ts
│   ├── core/
│   │   ├── server.ts
│   │   ├── router.ts
│   │   ├── check-runner.ts
│   │   ├── aggregator.ts
│   │   └── interval-parser.ts
│   ├── utils/
│   │   ├── http.ts
│   │   ├── time.ts
│   │   └── promise.ts
│   └── plugins/
│       ├── index.ts
│       ├── core/
│       │   ├── http.ts
│       │   ├── runner.ts
│       │   └── aggregator.ts
│       └── optional/
│           ├── metrics.ts
│           ├── cli.ts
│           ├── thresholds.ts
│           └── history.ts
├── tests/
├── examples/
├── website/
├── llms.txt
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── .gitignore
```

## Implementation Order

1. Create SPECIFICATION.md (this file)
2. Create IMPLEMENTATION.md
3. Create TASKS.md
4. Create configuration files
5. Implement core types and errors
6. Implement kernel (micro-kernel architecture)
7. Implement core utilities (http, time, promise)
8. Implement core modules (server, router, check-runner, aggregator, interval-parser)
9. Implement plugins (core + optional)
10. Create main entry point
11. Write unit tests
12. Write integration tests
13. Create examples
14. Create llms.txt
15. Build website
16. Final verification

## Validation Criteria

- All tests pass (100% success)
- 100% code coverage (lines, branches, functions)
- No TypeScript errors
- ESLint passes
- Package builds without errors
- All examples run successfully
- Website builds without errors
