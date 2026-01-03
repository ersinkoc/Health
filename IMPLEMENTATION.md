# @oxog/health Implementation Guide

## Architecture Overview

This document details the architecture and design decisions for @oxog/health, a zero-dependency health check library built with micro-kernel architecture.

## Design Principles

1. **Zero Dependencies**: All functionality implemented using only Node.js built-in modules
2. **Micro-Kernel**: Core kernel with pluggable architecture for extensibility
3. **Type Safety**: TypeScript strict mode with full type inference
4. **Testability**: Pure functions where possible, easily mockable dependencies
5. **LLM-Native**: Predictable APIs, rich documentation, examples for every feature

## Module Structure

### Core Layer

The core layer provides fundamental building blocks used by all plugins:

```
src/core/
├── server.ts      # HTTP server implementation using node:http
├── router.ts      # Route matching and request handling
├── check-runner.ts # Check execution with timeout/retry logic
├── aggregator.ts  # Status aggregation and health scoring
└── interval-parser.ts # Parse duration strings ('30s', '5m', etc.)
```

### Utils Layer

Utility functions used across the codebase:

```
src/utils/
├── http.ts        # HTTP utilities (parse URL, headers, etc.)
├── time.ts        # Time utilities (format duration, parse ISO)
└── promise.ts     # Promise utilities (timeout, retry, race)
```

### Plugin Layer

Pluggable architecture for extensibility:

```
src/plugins/
├── index.ts       # Plugin exports and factory functions
├── core/          # Core plugins (always loaded)
│   ├── http.ts    # HTTP server plugin
│   ├── runner.ts  # Check runner plugin
│   └── aggregator.ts # Aggregator plugin
└── optional/      # Optional plugins (opt-in)
    ├── metrics.ts # Prometheus/JSON metrics
    ├── cli.ts     # CLI interface
    ├── thresholds.ts # Custom threshold configuration
    └── history.ts # Check history retention
```

## Implementation Details

### 1. HTTP Server (src/core/server.ts)

Uses Node.js built-in `http` module with a custom request handler.

```typescript
import * as http from 'http';

interface ServerOptions {
  port: number;
  host?: string;
  basePath?: string;
}

class HealthServer {
  private server: http.Server;
  private router: Router;

  constructor(options: ServerOptions) {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.router = new Router(options.basePath || '/');
  }

  private handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    const handler = this.router.match(req.method || 'GET', req.url || '/');
    if (handler) {
      handler(req, res);
    } else {
      this.notFound(res);
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }
}
```

**Key Design Decisions:**
- No external HTTP framework
- Custom request/response handling
- Graceful shutdown support
- Keep-alive connection management

### 2. Router (src/core/router.ts)

Simple route matching with path parameter support.

```typescript
interface RouteHandler {
  (req: http.IncomingMessage, res: http.ServerResponse): void;
}

interface Route {
  pattern: RegExp;
  handler: RouteHandler;
  params: string[];
}

class Router {
  private routes: Map<string, Route[]> = new Map();

  get(path: string, handler: RouteHandler): void {
    this.addRoute('GET', path, handler);
  }

  match(method: string, path: string): RouteHandler | null {
    const routes = this.routes.get(method);
    if (!routes) return null;

    for (const route of routes) {
      const match = path.match(route.pattern);
      if (match) {
        return (req, res) => {
          (req as any).params = this.extractParams(route.params, match);
          route.handler(req, res);
        };
      }
    }
    return null;
  }
}
```

**Key Design Decisions:**
- RegExp-based routing for flexibility
- Named parameter extraction
- Method-specific routes (GET, POST, etc.)
- Clean separation from server logic

### 3. Check Runner (src/core/check-runner.ts)

Executes health checks with timeout and retry support.

```typescript
interface CheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

interface CheckConfig {
  handler: () => Promise<CheckResult>;
  timeout: number;
  retries: number;
  critical: boolean;
  weight: number;
}

class CheckRunner {
  async run(config: CheckConfig): Promise<CheckResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        const result = await this.executeWithTimeout(
          config.handler,
          config.timeout
        );
        return result;
      } catch (error) {
        lastError = error as Error;
      }
    }

    return {
      status: 'unhealthy',
      error: lastError?.message || 'Check failed',
    };
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout')), timeout);

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }
}
```

**Key Design Decisions:**
- Parallel check execution by default
- Configurable timeout per check
- Exponential backoff for retries
- Individual check isolation

### 4. Aggregator (src/core/aggregator.ts)

Aggregates check results into overall health status.

```typescript
interface AggregatorOptions {
  thresholds?: {
    healthy: number;
    degraded: number;
  };
}

class Aggregator {
  private thresholds: { healthy: number; degraded: number };

  constructor(options: AggregatorOptions = {}) {
    this.thresholds = {
      healthy: options.thresholds?.healthy ?? 80,
      degraded: options.thresholds?.degraded ?? 50,
    };
  }

  aggregate(results: Map<string, CheckResult>): HealthStatus {
    let totalWeight = 0;
    let weightedScore = 0;
    const checkStatuses: Record<string, CheckStatus> = {};

    for (const [name, result] of results) {
      const weight = result.weight || 100 / results.size;
      const score = result.status === 'healthy' ? 100 :
                   result.status === 'degraded' ? 50 : 0;

      totalWeight += weight;
      weightedScore += (score * weight) / 100;

      checkStatuses[name] = {
        status: result.status,
        latency: result.latency || 0,
        lastCheck: new Date().toISOString(),
        error: result.error,
        metadata: result.metadata,
      };
    }

    const overallScore = Math.round(weightedScore);
    const status = this.determineStatus(overallScore);

    return {
      status,
      score: overallScore,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: checkStatuses,
    };
  }

  private determineStatus(score: number): 'healthy' | 'degraded' | 'unhealthy' {
    if (score >= this.thresholds.healthy) return 'healthy';
    if (score >= this.thresholds.degraded) return 'degraded';
    return 'unhealthy';
  }
}
```

**Key Design Decisions:**
- Weighted scoring system
- Configurable thresholds
- Detailed per-check status in response
- Automatic weight distribution

### 5. Interval Parser (src/core/interval-parser.ts)

Parses duration strings into milliseconds.

```typescript
interface ParseResult {
  milliseconds: number;
  expression: string;
}

class IntervalParser {
  private static readonly PATTERNS = [
    { regex: /^(\d+)s$/, multiplier: 1000 },
    { regex: /^(\d+)m$/, multiplier: 60 * 1000 },
    { regex: /^(\d+)h$/, multiplier: 60 * 60 * 1000 },
    { regex: /^(\d+)d$/, multiplier: 24 * 60 * 60 * 1000 },
  ];

  parse(input: string | number): ParseResult {
    if (typeof input === 'number') {
      return { milliseconds: input, expression: `${input}ms` };
    }

    for (const pattern of IntervalParser.PATTERNS) {
      const match = input.match(pattern.regex);
      if (match) {
        const value = parseInt(match[1], 10);
        return {
          milliseconds: value * pattern.multiplier,
          expression: input,
        };
      }
    }

    throw new Error(`Invalid interval format: ${input}`);
  }

  format(milliseconds: number): string {
    if (milliseconds >= 24 * 60 * 60 * 1000) {
      return `${Math.floor(milliseconds / (24 * 60 * 60 * 1000))}d`;
    }
    if (milliseconds >= 60 * 60 * 1000) {
      return `${Math.floor(milliseconds / (60 * 60 * 1000))}h`;
    }
    if (milliseconds >= 60 * 1000) {
      return `${Math.floor(milliseconds / (60 * 1000))}m`;
    }
    return `${Math.floor(milliseconds / 1000)}s`;
  }
}
```

**Supported Formats:**
- `10s` = 10 seconds
- `5m` = 5 minutes
- `1h` = 1 hour
- `1d` = 1 day
- `30000` = 30000 milliseconds

## Plugin Architecture

### Kernel (src/kernel.ts)

The micro-kernel manages plugin lifecycle and provides shared context.

```typescript
interface Plugin<TContext = HealthContext> {
  name: string;
  version: string;
  dependencies?: string[];
  install: (kernel: HealthKernel<TContext>) => void;
  onInit?: (context: TContext) => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

class HealthKernel<TContext = HealthContext> {
  private plugins: Map<string, Plugin> = new Map();
  private context: TContext;

  constructor(initialContext: TContext) {
    this.context = initialContext;
  }

  use<T extends Plugin<TContext>>(plugin: T): this {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    this.checkDependencies(plugin);
    plugin.install(this);
    this.plugins.set(plugin.name, plugin);

    return this;
  }

  private checkDependencies(plugin: Plugin): void {
    if (!plugin.dependencies) return;

    for (const dep of plugin.dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Missing dependency: ${dep} (required by ${plugin.name})`);
      }
    }
  }
}
```

### Plugin Communication

Plugins communicate through:
1. **Shared Context**: All plugins access the same context object
2. **Events**: Event bus for publish/subscribe communication
3. **Direct Method Calls**: Kernel provides plugin access

```typescript
// Event Bus Example
interface EventBus {
  on(event: string, handler: (data: unknown) => void): void;
  emit(event: string, data: unknown): void;
  off(event: string, handler: (data: unknown) => void): void;
}
```

## Utility Implementations

### HTTP Utilities (src/utils/http.ts)

```typescript
function parseUrl(url: string): {
  protocol: string;
  hostname: string;
  port: number;
  pathname: string;
  search: string;
} {
  const parsed = new URL(url);
  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parseInt(parsed.port, 10) || (parsed.protocol === 'https:' ? 443 : 80),
    pathname: parsed.pathname,
    search: parsed.search,
  };
}

function getHeader(
  req: http.IncomingMessage,
  name: string
): string | undefined {
  return req.headers[name.toLowerCase()];
}

function setStatus(res: http.ServerResponse, code: number): void {
  res.statusCode = code;
}

function json(res: http.ServerResponse, data: unknown): void {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
```

### Time Utilities (src/utils/time.ts)

```typescript
function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms}ms`;
}

function parseIsoDate(date: string | Date): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

function now(): string {
  return new Date().toISOString();
}
```

### Promise Utilities (src/utils/promise.ts)

```typescript
function timeout<T>(
  promise: Promise<T>,
  ms: number,
  error?: Error
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(error || new Error(`Timeout after ${ms}ms`));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; delay: number }
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < options.maxAttempts) {
        await sleep(options.delay);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

## Error Handling

### Custom Errors (src/errors.ts)

```typescript
class HealthError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HealthError';
  }
}

const ERROR_CODES = {
  CHECK_TIMEOUT: 'CHECK_TIMEOUT',
  CHECK_FAILED: 'CHECK_FAILED',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_CONFIG: 'INVALID_CONFIG',
  PLUGIN_ERROR: 'PLUGIN_ERROR',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
} as const;

function createError(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: unknown
): HealthError {
  return new HealthError(message, ERROR_CODES[code], details);
}
```

## Metrics Implementation

### Prometheus Format

```typescript
function toPrometheus(metrics: HealthMetrics): string {
  const lines: string[] = [];

  // Health check status
  lines.push('# HELP health_check_status Current health check status (1=healthy, 0=unhealthy)');
  lines.push('# TYPE health_check_status gauge');
  for (const [name, check] of Object.entries(metrics.checks)) {
    const value = check.lastStatus === 'healthy' ? 1 : 0;
    lines.push(`health_check_status{name="${name}"} ${value}`);
  }

  // Latency
  lines.push('# HELP health_check_latency_ms Health check latency in milliseconds');
  lines.push('# TYPE health_check_latency_ms gauge');
  for (const [name, check] of Object.entries(metrics.checks)) {
    lines.push(`health_check_latency_ms{name="${name}"} ${check.lastLatency}`);
  }

  // Total checks
  lines.push('# HELP health_check_total Total health check executions');
  lines.push('# TYPE health_check_total counter');
  for (const [name, check] of Object.entries(metrics.checks)) {
    lines.push(`health_check_total{name="${name}",result="success"} ${check.success}`);
    lines.push(`health_check_total{name="${name}",result="failure"} ${check.failure}`);
  }

  // Health score
  lines.push('# HELP health_score Current health score (0-100)');
  lines.push('# TYPE health_score gauge');
  lines.push(`health_score ${metrics.score}`);

  // Uptime
  lines.push('# HELP health_uptime_seconds Server uptime in seconds');
  lines.push('# TYPE health_uptime_seconds counter');
  lines.push(`health_uptime_seconds ${metrics.uptime}`);

  return lines.join('\n') + '\n';
}
```

## CLI Implementation

Uses built-in process.argv for argument parsing:

```typescript
interface CliArgs {
  command: 'serve' | 'check';
  port?: number;
  host?: string;
  interval?: string;
  timeout?: number;
  config?: string;
  url?: string;
  format?: 'json' | 'table' | 'minimal';
  quiet?: boolean;
}

function parseArgs(args: string[]): CliArgs {
  // Simple argument parser without external dependencies
  const result: CliArgs = { command: 'serve' };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'serve' || arg === 'check') {
      result.command = arg;
    } else if (arg === '--port' || arg === '-p') {
      result.port = parseInt(args[++i], 10);
    } else if (arg === '--host' || arg === '-h') {
      result.host = args[++i];
    } else if (arg === '--url') {
      result.url = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      result.format = args[++i] as 'json' | 'table' | 'minimal';
    }
  }

  return result;
}
```

## File Organization

### Entry Points

1. **src/index.ts** - Main public API export
2. **src/plugins/index.ts** - Plugin exports and factory functions

### Module Boundaries

- **Core**: Cannot depend on plugins
- **Plugins**: Can depend on core and other plugins
- **Utils**: Pure functions, no side effects

## Testing Strategy

### Unit Tests

Test each module in isolation:
- Check runner: timeout, retry, parallel execution
- Aggregator: scoring, threshold detection
- Router: route matching, parameter extraction
- Interval parser: parsing, formatting

### Integration Tests

Test plugin integration:
- Server endpoints responding correctly
- Health checks executing in parallel
- Metrics endpoint format validation
- CLI command parsing and execution

### Test Utilities

```typescript
function createMockCheck(
  result: CheckResult,
  delay?: number
): () => Promise<CheckResult> {
  return async () => {
    if (delay) await sleep(delay);
    return result;
  };
}

function createFailingCheck(error: Error): () => Promise<CheckResult> {
  return async () => {
    throw error;
  };
}
```

## Build Configuration

### tsup Config

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

### Package Exports

```json
{
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
  }
}
```

## Performance Considerations

1. **Connection Pooling**: Not needed for health server
2. **Memory**: Reuse objects where possible
3. **CPU**: Parallel check execution by default
4. **I/O**: Async/await for all I/O operations

## Security Considerations

1. **No Input Validation**: Sanitize all inputs
2. **Rate Limiting**: Consider adding rate limits
3. **CORS**: Don't enable by default
4. **Authentication**: Not built-in, implement via middleware

## Future Extensibility

1. **Additional Protocols**: gRPC, WebSocket support
2. **Storage Backends**: Redis, database for history
3. **Notification Hooks**: Slack, PagerDuty integrations
4. **Cluster Support**: Multi-process health monitoring
