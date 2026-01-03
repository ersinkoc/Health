# @oxog/health - Zero-Dependency NPM Package

## Package Identity

| Field | Value |
|-------|-------|
| **NPM Package** | `@oxog/health` |
| **GitHub Repository** | `https://github.com/ersinkoc/health` |
| **Documentation Site** | `https://health.oxog.dev` |
| **License** | MIT |
| **Author** | Ersin Koç (ersinkoc) |

> **NO social media, Discord, email, or external links allowed.**

---

## Package Description

**One-line:** Zero-dependency health check server with Kubernetes-compatible probes and metrics exposure

A production-ready health check library for Node.js applications that provides HTTP health endpoints, liveness/readiness probes compatible with Kubernetes, customizable dependency checks (database, Redis, external APIs), graceful degradation with health scoring, Prometheus-compatible metrics, and both CLI and programmatic interfaces. Built with micro-kernel architecture for extensibility.

---

## NON-NEGOTIABLE RULES

These rules are **ABSOLUTE** and must be followed without exception.

### 1. ZERO RUNTIME DEPENDENCIES

```json
{
  "dependencies": {}  // MUST BE EMPTY - NO EXCEPTIONS
}
```

- Implement EVERYTHING from scratch
- No express, no fastify, no http frameworks - nothing
- Write your own HTTP server, parsers, validators
- If you think you need a dependency, you don't

**Allowed devDependencies only:**
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "tsup": "^8.0.0",
    "@types/node": "^20.0.0",
    "prettier": "^3.0.0",
    "eslint": "^9.0.0"
  }
}
```

### 2. 100% TEST COVERAGE

- Every line of code must be tested
- Every branch must be tested
- Every function must be tested
- **All tests must pass** (100% success rate)
- Use Vitest for testing
- Coverage thresholds enforced in config

### 3. MICRO-KERNEL ARCHITECTURE

All packages MUST use plugin-based architecture:

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

**Kernel responsibilities (minimal):**
- Plugin registration and lifecycle
- Event bus for inter-plugin communication
- Error boundary and recovery
- Configuration management

### 4. DEVELOPMENT WORKFLOW

Create these documents **FIRST**, before any code:

1. **SPECIFICATION.md** - Complete package specification
2. **IMPLEMENTATION.md** - Architecture and design decisions  
3. **TASKS.md** - Ordered task list with dependencies

Only after all three documents are complete, implement code following TASKS.md sequentially.

### 5. TYPESCRIPT STRICT MODE

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

### 6. LLM-NATIVE DESIGN

Package must be designed for both humans AND AI assistants:

- **llms.txt** file in root (< 2000 tokens)
- **Predictable API** naming (`create`, `get`, `set`, `use`, `remove`)
- **Rich JSDoc** with @example on every public API
- **15+ examples** organized by category
- **README** optimized for LLM consumption

### 7. NO EXTERNAL LINKS

- ✅ GitHub repository URL
- ✅ Custom domain (health.oxog.dev)
- ✅ npm package URL
- ❌ Social media (Twitter, LinkedIn, etc.)
- ❌ Discord/Slack links
- ❌ Email addresses
- ❌ Donation/sponsor links

---

## CORE FEATURES

### 1. HTTP Health Server

Zero-dependency HTTP server providing health check endpoints.

**API Example:**
```typescript
import { health } from '@oxog/health';

const server = health.serve({
  port: 9000,
  host: '0.0.0.0',
  basePath: '/',  // Optional: prefix for all endpoints
});

// Server exposes:
// GET /health - Full health status
// GET /ready  - Kubernetes readiness probe
// GET /live   - Kubernetes liveness probe
// GET /metrics - Prometheus/JSON metrics

await server.close(); // Graceful shutdown
```

### 2. Health Checks with Timeout/Retry

Register custom health checks with configurable timeout, retry, and criticality.

**API Example:**
```typescript
const server = health.serve({
  port: 9000,
  timeout: 5000,      // Global default timeout (ms)
  retries: 2,         // Global default retries
  interval: '10s',    // Check interval (string or ms)
  checks: {
    // Simple function check
    database: async () => {
      await db.ping();
      return { status: 'healthy', latency: 5 };
    },
    
    // Object config with overrides
    redis: {
      handler: () => redis.ping(),
      timeout: 2000,
      retries: 3,
      critical: true,  // Fail = whole service unhealthy
    },
    
    // Non-critical check (degraded, not unhealthy)
    cache: {
      handler: () => memcached.ping(),
      critical: false,
      weight: 20,  // Health score weight (0-100)
    },
    
    // External API check
    paymentApi: {
      handler: async () => {
        const res = await fetch('https://api.payment.com/health');
        if (!res.ok) throw new Error('Payment API down');
        return { status: 'healthy' };
      },
      timeout: 10000,
      critical: true,
    },
  },
});
```

### 3. Liveness & Readiness Probes

Kubernetes-compatible probe endpoints.

**API Example:**
```typescript
// GET /live - Liveness probe
// Returns 200 if server is alive (always true if responding)
// Response: { alive: true, uptime: 3600 }

// GET /ready - Readiness probe  
// Returns 200 only if ALL critical checks pass
// Returns 503 if any critical check fails
// Response: { ready: true } or { ready: false, failed: ['database'] }

// Kubernetes deployment example:
/*
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
  periodSeconds: 5
*/
```

### 4. Graceful Degradation & Health Scoring

Support for degraded states and health scores.

**API Example:**
```typescript
const server = health.serve({
  checks: {
    database: { handler: fn, critical: true, weight: 50 },
    redis: { handler: fn, critical: false, weight: 30 },
    api: { handler: fn, critical: false, weight: 20 },
  },
  thresholds: {
    healthy: 80,    // score >= 80 = healthy
    degraded: 50,   // score >= 50 = degraded
    // score < 50 = unhealthy
  },
});

// GET /health response:
{
  "status": "degraded",  // healthy | degraded | unhealthy
  "score": 70,           // 0-100 health score
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": { "status": "healthy", "latency": 5, "lastCheck": "..." },
    "redis": { "status": "unhealthy", "error": "Connection refused", "lastCheck": "..." },
    "api": { "status": "healthy", "latency": 120, "lastCheck": "..." }
  }
}
```

### 5. Prometheus & JSON Metrics

Metrics exposure with content negotiation.

**API Example:**
```typescript
// GET /metrics (Accept: text/plain or default)
// Prometheus text format:
/*
# HELP health_check_status Current health check status (1=healthy, 0=unhealthy)
# TYPE health_check_status gauge
health_check_status{name="database"} 1
health_check_status{name="redis"} 0

# HELP health_check_latency_ms Health check latency in milliseconds
# TYPE health_check_latency_ms gauge
health_check_latency_ms{name="database"} 5
health_check_latency_ms{name="redis"} 0

# HELP health_check_total Total health check executions
# TYPE health_check_total counter
health_check_total{name="database",result="success"} 1234
health_check_total{name="database",result="failure"} 2

# HELP health_score Current health score (0-100)
# TYPE health_score gauge
health_score 70

# HELP health_uptime_seconds Server uptime in seconds
# TYPE health_uptime_seconds counter
health_uptime_seconds 3600
*/

// GET /metrics (Accept: application/json)
{
  "uptime": 3600,
  "score": 70,
  "checks": {
    "database": {
      "success": 1234,
      "failure": 2,
      "avgLatency": 5,
      "lastLatency": 4,
      "lastStatus": "healthy"
    }
  }
}
```

### 6. CLI Interface

Command-line interface for serving and checking health.

**API Example:**
```bash
# Start health server
npx @oxog/health serve --port 9000

# With built-in checks (auto-detect from env)
npx @oxog/health serve --port 9000 --check-db --check-redis

# Custom config file
npx @oxog/health serve --config health.config.js

# One-shot check against running server
npx @oxog/health check http://localhost:9000/health

# Check with specific format
npx @oxog/health check http://localhost:9000/health --format json
npx @oxog/health check http://localhost:9000/health --format table

# Exit codes: 0 = healthy, 1 = degraded, 2 = unhealthy
```

### 7. Programmatic One-Shot Check

Check health without running a server.

**API Example:**
```typescript
import { health } from '@oxog/health';

// One-shot check (no server)
const result = await health.check({
  database: () => db.ping(),
  redis: () => redis.ping(),
  api: async () => {
    const res = await fetch('https://api.example.com/health');
    return res.ok;
  },
});

// Result:
{
  "healthy": true,
  "score": 100,
  "checks": {
    "database": { "status": "healthy", "latency": 5 },
    "redis": { "status": "healthy", "latency": 2 },
    "api": { "status": "healthy", "latency": 150 }
  }
}

// Check remote health endpoint
const remote = await health.checkRemote('http://localhost:9000/health');
console.log(remote.status); // 'healthy' | 'degraded' | 'unhealthy'
```

### 8. Configurable Intervals

Support for interval-based health checking with string parsing.

**API Example:**
```typescript
health.serve({
  interval: '30s',      // Check every 30 seconds
  // Supported formats: '10s', '5m', '1h', 30000 (ms)
  
  checks: {
    database: {
      handler: () => db.ping(),
      interval: '1m',   // Override: check every minute
    },
    redis: {
      handler: () => redis.ping(),
      interval: '10s',  // Override: check every 10 seconds
    },
  },
});
```

---

## PLUGIN SYSTEM

### Plugin Interface

```typescript
/**
 * Plugin interface for extending health check functionality.
 * 
 * @typeParam TContext - Shared context type between plugins
 */
export interface Plugin<TContext = HealthContext> {
  /** Unique plugin identifier (kebab-case) */
  name: string;
  
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  
  /** Other plugins this plugin depends on */
  dependencies?: string[];
  
  /**
   * Called when plugin is registered.
   * @param kernel - The kernel instance
   */
  install: (kernel: HealthKernel<TContext>) => void;
  
  /**
   * Called after all plugins are installed.
   * @param context - Shared context object
   */
  onInit?: (context: TContext) => void | Promise<void>;
  
  /**
   * Called when plugin is unregistered.
   */
  onDestroy?: () => void | Promise<void>;
  
  /**
   * Called on error in this plugin.
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}
```

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

---

## API DESIGN

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

### Type Definitions

```typescript
/**
 * Health check function type.
 * Can return void (success), boolean, or detailed result.
 */
export type CheckHandler = () => 
  | void 
  | boolean 
  | CheckResult 
  | Promise<void | boolean | CheckResult>;

/**
 * Detailed check result.
 */
export interface CheckResult {
  /** Check status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** Latency in milliseconds */
  latency?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Error message if unhealthy */
  error?: string;
}

/**
 * Health check configuration.
 */
export interface CheckConfig {
  /** Check handler function */
  handler: CheckHandler;
  /** Timeout in milliseconds (overrides global) */
  timeout?: number;
  /** Number of retries on failure */
  retries?: number;
  /** If true, failure marks entire health as unhealthy */
  critical?: boolean;
  /** Weight for health score (0-100, default: auto-distributed) */
  weight?: number;
  /** Check interval (overrides global) */
  interval?: string | number;
}

/**
 * Server configuration options.
 */
export interface ServeOptions {
  /** HTTP port to listen on */
  port: number;
  /** Host to bind to */
  host?: string;
  /** Base path prefix for endpoints */
  basePath?: string;
  /** Global timeout for checks (ms) */
  timeout?: number;
  /** Global retry count */
  retries?: number;
  /** Global check interval */
  interval?: string | number;
  /** Health check definitions */
  checks?: Record<string, CheckHandler | CheckConfig>;
  /** Health score thresholds */
  thresholds?: ThresholdConfig;
}

/**
 * Threshold configuration for health scoring.
 */
export interface ThresholdConfig {
  /** Minimum score for healthy status (default: 80) */
  healthy?: number;
  /** Minimum score for degraded status (default: 50) */
  degraded?: number;
}

/**
 * Health server instance.
 */
export interface HealthServer {
  /** Server port */
  readonly port: number;
  /** Server start time */
  readonly startTime: Date;
  /** Register a new check */
  register(name: string, check: CheckHandler | CheckConfig): void;
  /** Unregister a check */
  unregister(name: string): boolean;
  /** List all registered checks */
  list(): string[];
  /** Get current health status */
  status(): Promise<HealthStatus>;
  /** Close server gracefully */
  close(): Promise<void>;
}

/**
 * Full health status response.
 */
export interface HealthStatus {
  /** Overall status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Health score (0-100) */
  score: number;
  /** Server uptime in seconds */
  uptime: number;
  /** ISO timestamp */
  timestamp: string;
  /** Individual check results */
  checks: Record<string, CheckStatus>;
}

/**
 * Individual check status.
 */
export interface CheckStatus {
  /** Check status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** Latency in milliseconds */
  latency: number;
  /** Last check ISO timestamp */
  lastCheck: string;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}
```

### CLI Interface

```bash
# Serve command
npx @oxog/health serve [options]
  -p, --port <number>      Port to listen on (default: 9000)
  -h, --host <string>      Host to bind to (default: 0.0.0.0)
  -i, --interval <string>  Check interval (default: 30s)
  -t, --timeout <number>   Check timeout in ms (default: 5000)
  --check-db               Enable database check (uses DATABASE_URL)
  --check-redis            Enable Redis check (uses REDIS_URL)
  -c, --config <file>      Config file path

# Check command
npx @oxog/health check <url> [options]
  -f, --format <type>      Output format: json | table | minimal (default: table)
  -q, --quiet              Only output exit code
  --timeout <number>       Request timeout in ms (default: 5000)

# Exit codes
0 = healthy
1 = degraded  
2 = unhealthy
3 = error (connection failed, timeout, etc.)
```

---

## TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| Runtime | Node.js (uses node:http, node:net) |
| Module Format | ESM + CJS (dual package) |
| Node.js Version | >= 18 |
| TypeScript Version | >= 5.0 |
| Bundle Size (core) | < 5KB gzipped |
| Bundle Size (all plugins) | < 15KB gzipped |

---

## LLM-NATIVE REQUIREMENTS

### 1. llms.txt File

Create `/llms.txt` in project root (< 2000 tokens):

```markdown
# @oxog/health

> Zero-dependency health check server with Kubernetes-compatible probes

## Install

```bash
npm install @oxog/health
```

## Basic Usage

```typescript
import { health } from '@oxog/health';

const server = health.serve({
  port: 9000,
  checks: { db: () => db.ping() }
});
```

## API Summary

### Main
- `health.serve(options)` - Start health server
- `health.check(checks)` - One-shot health check
- `health.checkRemote(url)` - Check remote endpoint
- `health.create()` - Create custom kernel

### Server Methods
- `server.register(name, check)` - Add check
- `server.unregister(name)` - Remove check
- `server.list()` - List checks
- `server.status()` - Get current status
- `server.close()` - Graceful shutdown

### Endpoints
- `GET /health` - Full health status
- `GET /ready` - Kubernetes readiness
- `GET /live` - Kubernetes liveness
- `GET /metrics` - Prometheus metrics

### Core Plugins
- `http` - HTTP server
- `runner` - Check executor
- `aggregator` - Status aggregator

### Optional Plugins
- `metrics` - Prometheus + JSON metrics
- `cli` - Command line interface
- `thresholds` - Custom thresholds
- `history` - Check history

## Common Patterns

### Database + Redis Check
```typescript
health.serve({
  port: 9000,
  checks: {
    database: { handler: () => db.ping(), critical: true },
    redis: { handler: () => redis.ping(), critical: false }
  }
});
```

### Graceful Degradation
```typescript
health.serve({
  checks: {
    db: { handler: fn, critical: true, weight: 60 },
    cache: { handler: fn, critical: false, weight: 40 }
  },
  thresholds: { healthy: 80, degraded: 50 }
});
```

### CLI Usage
```bash
npx @oxog/health serve --port 9000
npx @oxog/health check http://localhost:9000/health
```

## Errors

| Code | Meaning | Solution |
|------|---------|----------|
| `CHECK_TIMEOUT` | Check exceeded timeout | Increase timeout or fix slow check |
| `CHECK_FAILED` | Check threw error | Check handler implementation |
| `SERVER_ERROR` | HTTP server error | Check port availability |
| `INVALID_CONFIG` | Invalid configuration | Review config options |

## Links

- Docs: https://health.oxog.dev
- GitHub: https://github.com/ersinkoc/health
```

### 2. API Naming Standards

Use predictable patterns LLMs can infer:

```typescript
// ✅ GOOD - Predictable
health.serve()       // Start server
health.check()       // Run checks
health.create()      // Create instance
server.register()    // Add check
server.unregister()  // Remove check
server.list()        // List checks
server.status()      // Get status
server.close()       // Stop server

// ❌ BAD - Unpredictable
health.start()       // serve vs start?
health.run()         // ambiguous
server.add()         // register is clearer
server.stop()        // close is standard
```

### 3. Example Organization

```
examples/
├── 01-basic/
│   ├── minimal.ts           # Minimal working example
│   ├── with-checks.ts       # Multiple checks
│   └── README.md
├── 02-checks/
│   ├── database.ts          # Database health check
│   ├── redis.ts             # Redis health check
│   ├── http-api.ts          # External API check
│   ├── custom.ts            # Custom check logic
│   └── README.md
├── 03-kubernetes/
│   ├── deployment.yaml      # K8s deployment example
│   ├── probes.ts            # Probe configuration
│   └── README.md
├── 04-metrics/
│   ├── prometheus.ts        # Prometheus integration
│   ├── grafana-dashboard.json
│   └── README.md
├── 05-degradation/
│   ├── critical-checks.ts   # Critical vs non-critical
│   ├── health-score.ts      # Health scoring
│   └── README.md
├── 06-cli/
│   ├── serve.sh             # CLI serve examples
│   ├── check.sh             # CLI check examples
│   └── README.md
└── 07-advanced/
    ├── custom-plugin.ts     # Writing plugins
    ├── middleware.ts        # Request middleware
    ├── clustering.ts        # Multi-process
    └── README.md
```

---

## PROJECT STRUCTURE

```
health/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Website deploy only
├── src/
│   ├── index.ts                # Main entry, public exports
│   ├── kernel.ts               # Micro kernel core
│   ├── types.ts                # Type definitions
│   ├── errors.ts               # Custom error classes
│   ├── core/
│   │   ├── server.ts           # HTTP server implementation
│   │   ├── router.ts           # Route handling
│   │   ├── check-runner.ts     # Check execution engine
│   │   ├── aggregator.ts       # Status aggregation
│   │   └── interval-parser.ts  # Parse '30s', '5m', etc.
│   ├── utils/
│   │   ├── http.ts             # HTTP utilities
│   │   ├── time.ts             # Time utilities
│   │   └── promise.ts          # Promise utilities (timeout, retry)
│   └── plugins/
│       ├── index.ts            # Plugin exports
│       ├── core/
│       │   ├── http.ts         # HTTP server plugin
│       │   ├── runner.ts       # Check runner plugin
│       │   └── aggregator.ts   # Aggregator plugin
│       └── optional/
│           ├── metrics.ts      # Prometheus + JSON metrics
│           ├── cli.ts          # CLI interface
│           ├── thresholds.ts   # Custom thresholds
│           └── history.ts      # Check history
├── tests/
│   ├── unit/
│   │   ├── kernel.test.ts
│   │   ├── server.test.ts
│   │   ├── check-runner.test.ts
│   │   ├── aggregator.test.ts
│   │   └── plugins/
│   ├── integration/
│   │   ├── serve.test.ts
│   │   ├── probes.test.ts
│   │   ├── metrics.test.ts
│   │   └── cli.test.ts
│   └── fixtures/
│       └── checks.ts
├── examples/
│   ├── 01-basic/
│   ├── 02-checks/
│   ├── 03-kubernetes/
│   ├── 04-metrics/
│   ├── 05-degradation/
│   ├── 06-cli/
│   └── 07-advanced/
├── website/                    # React + Vite site
│   ├── public/
│   │   ├── CNAME               # health.oxog.dev
│   │   └── llms.txt
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
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

---

## WEBSITE REQUIREMENTS

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Syntax Highlighting**: Prism React Renderer
- **Icons**: Lucide React
- **Domain**: health.oxog.dev

### IDE-Style Code Blocks

All code blocks MUST have:
- Line numbers (muted, non-selectable)
- Syntax highlighting
- Header bar with filename/language
- Copy button with "Copied!" feedback
- Rounded corners, subtle border
- Dark/light theme support

### Theme System

- Dark mode (default)
- Light mode
- Toggle button in navbar
- Persist in localStorage
- Respect system preference on first visit

### Required Pages

1. **Home** - Hero, features, install, example
2. **Getting Started** - Installation, basic usage
3. **API Reference** - Complete documentation
4. **Examples** - Organized by category
5. **Plugins** - Core, optional, custom
6. **Kubernetes Guide** - K8s integration

### Footer

- Package name
- MIT License
- © 2025 Ersin Koç
- GitHub link only

---

## GITHUB ACTIONS

Single workflow file: `.github/workflows/deploy.yml`

```yaml
name: Deploy Website

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Build package
        run: npm run build
      
      - name: Build website
        working-directory: ./website
        run: |
          npm ci
          npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './website/dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## CONFIG FILES

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/plugins/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
});
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'website/',
        'examples/',
        '*.config.*',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
```

### package.json

```json
{
  "name": "@oxog/health",
  "version": "1.0.0",
  "description": "Zero-dependency health check server with Kubernetes-compatible probes and metrics exposure",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "health": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./plugins": {
      "import": {
        "types": "./dist/plugins/index.d.ts",
        "default": "./dist/plugins/index.js"
      },
      "require": {
        "types": "./dist/plugins/index.d.cts",
        "default": "./dist/plugins/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test:coverage"
  },
  "keywords": [
    "health",
    "health-check",
    "healthcheck",
    "kubernetes",
    "k8s",
    "probes",
    "liveness",
    "readiness",
    "prometheus",
    "metrics",
    "zero-dependency",
    "typescript"
  ],
  "author": "Ersin Koç",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ersinkoc/health.git"
  },
  "bugs": {
    "url": "https://github.com/ersinkoc/health/issues"
  },
  "homepage": "https://health.oxog.dev",
  "engines": {
    "node": ">=18"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

---

## IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Create SPECIFICATION.md with complete spec
- [ ] Create IMPLEMENTATION.md with architecture
- [ ] Create TASKS.md with ordered task list
- [ ] All three documents reviewed and complete

### During Implementation
- [ ] Follow TASKS.md sequentially
- [ ] Write tests before or with each feature
- [ ] Maintain 100% coverage throughout
- [ ] JSDoc on every public API with @example
- [ ] Create examples as features are built

### Package Completion
- [ ] All tests passing (100%)
- [ ] Coverage at 100% (lines, branches, functions)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Package builds without errors

### LLM-Native Completion
- [ ] llms.txt created (< 2000 tokens)
- [ ] llms.txt copied to website/public/
- [ ] README first 500 tokens optimized
- [ ] All public APIs have JSDoc + @example
- [ ] 15+ examples in organized folders
- [ ] package.json has 8-12 keywords
- [ ] API uses standard naming patterns

### Website Completion
- [ ] All pages implemented
- [ ] IDE-style code blocks with line numbers
- [ ] Copy buttons working
- [ ] Dark/Light theme toggle
- [ ] CNAME file with health.oxog.dev
- [ ] Mobile responsive
- [ ] Footer with Ersin Koç, MIT, GitHub only

### Final Verification
- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` shows 100%
- [ ] Website builds without errors
- [ ] All examples run successfully
- [ ] README is complete and accurate

---

## BEGIN IMPLEMENTATION

Start by creating **SPECIFICATION.md** with the complete package specification based on everything above.

Then create **IMPLEMENTATION.md** with architecture decisions.

Then create **TASKS.md** with ordered, numbered tasks.

Only after all three documents are complete, begin implementing code by following TASKS.md sequentially.

**Remember:**
- This package will be published to npm
- It must be production-ready
- Zero runtime dependencies
- 100% test coverage
- Professionally documented
- LLM-native design
- Beautiful documentation website
