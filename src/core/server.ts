/**
 * @oxog/health - HTTP Server
 *
 * Zero-dependency HTTP server for health check endpoints.
 * @packageDocumentation
 */

import type { IncomingMessage, ServerResponse, Server as HttpServer } from 'http';
import type {
  ServeOptions,
  HealthServer,
  HealthStatus,
  CheckHandler,
  CheckConfig,
  CheckResult,
} from '../types.js';
import { Router, createRouter } from './router.js';
import { CheckRunner, createCheckRunner } from './check-runner.js';
import { Aggregator, createAggregator } from './aggregator.js';
import { IntervalParser } from './interval-parser.js';
import { json, text, notFound, serviceUnavailable } from '../utils/http.js';
import { nowMilliseconds } from '../utils/time.js';
import {
  ServerError,
  InvalidConfigError,
  invalidConfig,
} from '../errors.js';

// ============================================================================
// Default Values
// ============================================================================

const DEFAULTS: Required<ServeOptions> = {
  port: 9000,
  host: '0.0.0.0',
  basePath: '/',
  timeout: 5000,
  retries: 2,
  interval: '30s',
  checks: {},
  thresholds: { healthy: 80, degraded: 50 },
};

// ============================================================================
// Health Server Implementation
// ============================================================================

/**
 * Health check HTTP server implementation.
 *
 * @example
 * ```typescript
 * const server = new HealthServer({
 *   port: 9000,
 *   host: '0.0.0.0',
 *   checks: {
 *     database: () => db.ping()
 *   }
 * });
 *
 * await server.start();
 * console.log('Server running on http://0.0.0.0:9000');
 * await server.close();
 * ```
 */
export class HealthServerImpl implements HealthServer {
  private server: HttpServer | null = null;
  private router: Router;
  private runner: CheckRunner;
  private aggregator: Aggregator;
  private intervalParser: IntervalParser;
  private checks: Map<string, CheckConfig> = new Map();
  private checkResults: Map<string, CheckResult> = new Map();
  private checkIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private options: Required<ServeOptions>;
  private intervalCheckTimer: ReturnType<typeof setInterval> | null = null;
  private _startTime: Date = new Date();

  /**
   * Create a new health server.
   *
   * @param options - Server configuration
   */
  constructor(options: ServeOptions) {
    this.options = this.mergeDefaults(options);
    this.router = createRouter({ basePath: this.options.basePath });
    this.runner = createCheckRunner({
      timeout: this.options.timeout,
      retries: this.options.retries,
    });
    this.aggregator = createAggregator(this.options.thresholds);
    this.intervalParser = new IntervalParser();
    this._startTime = new Date();

    this.setupRoutes();
    this.registerChecks(this.options.checks);
  }

  /**
   * Get the server port.
   */
  get port(): number {
    return this.server?.address() && typeof this.server.address() === 'object'
      ? (this.server.address() as { port: number }).port
      : this.options.port;
  }

  /**
   * Get the server host.
   */
  get host(): string {
    return this.options.host;
  }

  /**
   * Get the server start time.
   */
  get startTime(): Date {
    return this._startTime;
  }

  /**
   * Start the HTTP server.
   */
  async start(): Promise<void> {
    if (this.server) {
      throw new ServerError('Server is already started');
    }

    return new Promise((resolve, reject) => {
      this.server = this.createServer();

      this.server.on('listening', () => {
        this._startTime = new Date();
        this.startIntervalChecks();
        resolve();
      });

      this.server.on('error', (error) => {
        reject(new ServerError(`Failed to start server: ${(error as Error).message}`, error));
      });

      // Start listening
      this.server.listen({
        port: this.options.port,
        host: this.options.host,
      });
    });
  }

  /**
   * Close the server gracefully.
   */
  async close(): Promise<void> {
    // Stop interval checks
    this.stopIntervalChecks();

    // Clear all check intervals
    for (const interval of this.checkIntervals.values()) {
      clearInterval(interval);
    }
    this.checkIntervals.clear();

    // Close server
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.server = null;
          resolve();
        });
      });
    }
  }

  /**
   * Register a health check.
   */
  register(name: string, check: CheckHandler | CheckConfig): void {
    const config = this.normalizeCheckConfig(name, check);
    this.checks.set(name, config);

    // If server is running, run the check immediately
    if (this.server) {
      this.runCheck(name, config);
    }
  }

  /**
   * Unregister a health check.
   */
  unregister(name: string): boolean {
    const existed = this.checks.has(name);
    this.checks.delete(name);
    this.checkResults.delete(name);

    // Clear interval if exists
    const interval = this.checkIntervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(name);
    }

    return existed;
  }

  /**
   * List all registered checks.
   */
  list(): string[] {
    return Array.from(this.checks.keys());
  }

  /**
   * Get current health status.
   */
  async status(): Promise<HealthStatus> {
    // Run all checks
    await this.runAllChecks();

    // Get uptime
    const uptime = process.uptime();

    // Aggregate results
    const runResults = new Map<string, { result: CheckResult; duration: number }>();
    for (const [name, result] of this.checkResults) {
      runResults.set(name, { result, duration: result.latency ?? 0 });
    }

    return this.aggregator.aggregate(
      new Map(
        Array.from(runResults.entries()).map(([name, { result, duration }]) => [
          name,
          { name, result, duration, attempts: 1 },
        ])
      ),
      uptime
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Merge options with defaults.
   */
  private mergeDefaults(options: ServeOptions): Required<ServeOptions> {
    return {
      port: options.port ?? DEFAULTS.port,
      host: options.host ?? DEFAULTS.host,
      basePath: options.basePath ?? DEFAULTS.basePath,
      timeout: options.timeout ?? DEFAULTS.timeout,
      retries: options.retries ?? DEFAULTS.retries,
      interval: options.interval ?? DEFAULTS.interval,
      checks: options.checks ?? DEFAULTS.checks,
      thresholds: options.thresholds ?? DEFAULTS.thresholds,
    };
  }

  /**
   * Create the HTTP server.
   */
  private createServer(): HttpServer {
    return require('http').createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        this.handleRequest(req, res);
      }
    );
  }

  /**
   * Setup routes.
   */
  private setupRoutes(): void {
    const basePath = this.options.basePath;

    // Health endpoint
    this.router.get(`${basePath}health`, async (_req, res) => {
      const status = await this.status();
      json(res, status);
    });

    // Readiness probe
    this.router.get(`${basePath}ready`, async (_req, res) => {
      const status = await this.status();
      if (status.status === 'unhealthy') {
        serviceUnavailable(res, 'Service not ready');
      } else {
        json(res, { ready: true });
      }
    });

    // Liveness probe
    this.router.get(`${basePath}live`, (_req, res) => {
      json(res, {
        alive: true,
        uptime: Math.floor(process.uptime()),
      });
    });

    // Metrics endpoint (basic implementation)
    this.router.get(`${basePath}metrics`, async (_req, res) => {
      const status = await this.status();
      const accept = _req.headers.accept;

      if (accept && accept.includes('application/json')) {
        json(res, this.formatJsonMetrics(status));
      } else {
        text(res, this.formatPrometheusMetrics(status));
      }
    });

    // Status alias for health
    this.router.get(`${basePath}status`, async (_req, res) => {
      const status = await this.status();
      json(res, status);
    });
  }

  /**
   * Handle incoming requests.
   */
  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Try to handle with router
    const handled = this.router.handle(req, res);

    if (!handled) {
      notFound(res, 'Not Found');
    }
  }

  /**
   * Register checks from options.
   */
  private registerChecks(checks: Record<string, CheckHandler | CheckConfig>): void {
    for (const [name, check] of Object.entries(checks)) {
      this.register(name, check);
    }
  }

  /**
   * Normalize check configuration.
   */
  private normalizeCheckConfig(
    name: string,
    check: CheckHandler | CheckConfig
  ): CheckConfig {
    if (typeof check === 'function') {
      return {
        handler: check,
        timeout: this.options.timeout,
        retries: this.options.retries,
        critical: false,
        weight: 100,
      };
    }

    return {
      handler: check.handler,
      timeout: check.timeout ?? this.options.timeout,
      retries: check.retries ?? this.options.retries,
      critical: check.critical ?? false,
      weight: check.weight ?? 100,
    };
  }

  /**
   * Run a single check.
   */
  private async runCheck(name: string, config: CheckConfig): Promise<void> {
    const startTime = nowMilliseconds();

    try {
      const result = await this.runner.run(name, config);
      this.checkResults.set(name, result.result);
    } catch (error) {
      this.checkResults.set(name, {
        status: 'unhealthy',
        error: (error as Error).message,
        latency: nowMilliseconds() - startTime,
      });
    }
  }

  /**
   * Run all checks.
   */
  private async runAllChecks(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [name, config] of this.checks) {
      promises.push(this.runCheck(name, config));
    }

    await Promise.all(promises);
  }

  /**
   * Start interval-based checks.
   */
  private startIntervalChecks(): void {
    const globalIntervalMs = this.intervalParser.parse(this.options.interval).milliseconds;

    for (const [name, config] of this.checks) {
      const intervalMs = config.interval
        ? this.intervalParser.parse(config.interval).milliseconds
        : globalIntervalMs;

      const timer = setInterval(() => {
        this.runCheck(name, config);
      }, intervalMs);

      this.checkIntervals.set(name, timer);
    }

    // Run all checks on startup
    this.runAllChecks();
  }

  /**
   * Stop all interval checks.
   */
  private stopIntervalChecks(): void {
    if (this.intervalCheckTimer) {
      clearInterval(this.intervalCheckTimer);
      this.intervalCheckTimer = null;
    }
  }

  /**
   * Format metrics as Prometheus text format.
   */
  private formatPrometheusMetrics(status: HealthStatus): string {
    const lines: string[] = [];

    // Health check status
    lines.push('# HELP health_check_status Current health check status (1=healthy, 0=unhealthy)');
    lines.push('# TYPE health_check_status gauge');
    for (const [name, check] of Object.entries(status.checks)) {
      const value = check.status === 'healthy' ? 1 : check.status === 'degraded' ? 0.5 : 0;
      lines.push(`health_check_status{name="${name}"} ${value}`);
    }

    // Latency
    lines.push('# HELP health_check_latency_ms Health check latency in milliseconds');
    lines.push('# TYPE health_check_latency_ms gauge');
    for (const [name, check] of Object.entries(status.checks)) {
      lines.push(`health_check_latency_ms{name="${name}"} ${check.latency}`);
    }

    // Health score
    lines.push('# HELP health_score Current health score (0-100)');
    lines.push('# TYPE health_score gauge');
    lines.push(`health_score ${status.score}`);

    // Uptime
    lines.push('# HELP health_uptime_seconds Server uptime in seconds');
    lines.push('# TYPE health_uptime_seconds counter');
    lines.push(`health_uptime_seconds ${status.uptime}`);

    return lines.join('\n') + '\n';
  }

  /**
   * Format metrics as JSON.
   */
  private formatJsonMetrics(status: HealthStatus): object {
    return {
      uptime: status.uptime,
      score: status.score,
      status: status.status,
      checks: Object.fromEntries(
        Object.entries(status.checks).map(([name, check]) => [
          name,
          {
            status: check.status,
            latency: check.latency,
            lastCheck: check.lastCheck,
          },
        ])
      ),
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create and start a health server.
 *
 * @example
 * ```typescript
 * const server = serve({
 *   port: 9000,
 *   checks: {
 *     database: () => db.ping()
 *   }
 * });
 * await server.start();
 * ```
 */
export async function serve(options: ServeOptions): Promise<HealthServer> {
  const server = new HealthServerImpl(options);
  await server.start();
  return server;
}

/**
 * Create a health server without starting it.
 *
 * @example
 * ```typescript
 * const server = createServer({
 *   port: 9000,
 *   checks: { database: () => db.ping() }
 * });
 * await server.start();
 * ```
 */
export function createServer(options: ServeOptions): HealthServer {
  return new HealthServerImpl(options);
}
