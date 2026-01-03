/**
 * @oxog/health - Type Definitions
 *
 * Zero-dependency health check library for Node.js applications.
 * @packageDocumentation
 */

import type * as http from 'http';

// ============================================================================
// Check Types
// ============================================================================

/**
 * Health check handler function type.
 * Can return void (success), boolean, or detailed result.
 *
 * @example
 * ```typescript
 * const databaseCheck: CheckHandler = async () => {
 *   await db.ping();
 *   return { status: 'healthy', latency: 5 };
 * };
 * ```
 */
export type CheckHandler = () =>
  | void
  | boolean
  | CheckResult
  | Promise<void | boolean | CheckResult>;

/**
 * Detailed health check result.
 *
 * @example
 * ```typescript
 * const result: CheckResult = {
 *   status: 'healthy',
 *   latency: 5,
 *   metadata: { connections: 10 }
 * };
 * ```
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
  /** Weight for health scoring (0-100) */
  weight?: number;
  /** Whether failure marks entire service unhealthy */
  critical?: boolean;
}

/**
 * Health check configuration.
 *
 * @example
 * ```typescript
 * const config: CheckConfig = {
 *   handler: () => db.ping(),
 *   timeout: 5000,
 *   retries: 3,
 *   critical: true,
 *   weight: 50
 * };
 * ```
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

// ============================================================================
// Server Types
// ============================================================================

/**
 * Threshold configuration for health scoring.
 *
 * @example
 * ```typescript
 * const thresholds: ThresholdConfig = {
 *   healthy: 80,    // score >= 80 = healthy
 *   degraded: 50    // score >= 50 = degraded
 * };
 * ```
 */
export interface ThresholdConfig {
  /** Minimum score for healthy status (default: 80) */
  healthy?: number;
  /** Minimum score for degraded status (default: 50) */
  degraded?: number;
}

/**
 * Server configuration options.
 *
 * @example
 * ```typescript
 * const options: ServeOptions = {
 *   port: 9000,
 *   host: '0.0.0.0',
 *   basePath: '/',
 *   timeout: 5000,
 *   retries: 2,
 *   interval: '30s',
 *   checks: {
 *     database: { handler: () => db.ping(), critical: true }
 *   },
 *   thresholds: { healthy: 80, degraded: 50 }
 * };
 * ```
 */
export interface ServeOptions {
  /** HTTP port to listen on */
  port: number;
  /** Host to bind to (default: '0.0.0.0') */
  host?: string;
  /** Base path prefix for endpoints (default: '/') */
  basePath?: string;
  /** Global timeout for checks in ms (default: 5000) */
  timeout?: number;
  /** Global retry count (default: 2) */
  retries?: number;
  /** Global check interval (default: '30s') */
  interval?: string | number;
  /** Health check definitions */
  checks?: Record<string, CheckHandler | CheckConfig>;
  /** Health score thresholds */
  thresholds?: ThresholdConfig;
}

// ============================================================================
// Status Types
// ============================================================================

/**
 * Individual check status in health response.
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

/**
 * Full health status response.
 *
 * @example
 * ```typescript
 * const status: HealthStatus = {
 *   status: 'healthy',
 *   score: 100,
 *   uptime: 3600,
 *   timestamp: '2024-01-15T10:30:00Z',
 *   checks: {
 *     database: { status: 'healthy', latency: 5, lastCheck: '2024-01-15T10:30:00Z' }
 *   }
 * };
 * ```
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

// ============================================================================
// Server Interface
// ============================================================================

/**
 * Health server instance interface.
 *
 * @example
 * ```typescript
 * const server = health.serve({ port: 9000 });
 * server.register('db', () => db.ping());
 * await server.close();
 * ```
 */
export interface HealthServer {
  /** Server port */
  readonly port: number;
  /** Server host */
  readonly host: string;
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
  /** Start the server */
  start(): Promise<void>;
}

// ============================================================================
// One-Shot Check Types
// ============================================================================

/**
 * Options for one-shot health check.
 */
export interface OneShotCheckOptions {
  /** Health checks to run */
  checks: Record<string, CheckHandler | CheckConfig>;
  /** Global timeout (default: 5000) */
  timeout?: number;
  /** Whether to run checks in parallel (default: true) */
  parallel?: boolean;
}

/**
 * Result of one-shot health check.
 */
export interface OneShotCheckResult {
  /** Overall healthy status */
  healthy: boolean;
  /** Health score (0-100) */
  score: number;
  /** Overall status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Check results */
  checks: Record<string, CheckStatus>;
  /** Total execution time in ms */
  duration: number;
}

// ============================================================================
// Remote Check Types
// ============================================================================

/**
 * Options for remote health check.
 */
export interface RemoteCheckOptions {
  /** Request timeout in ms (default: 5000) */
  timeout?: number;
  /** Custom fetch function */
  fetch?: typeof fetch;
}

/**
 * Result of remote health check.
 */
export interface RemoteCheckResult {
  /** Status from remote endpoint */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  /** Raw response data */
  data?: HealthStatus;
  /** HTTP status code */
  statusCode?: number;
  /** Error message if failed */
  error?: string;
  /** Latency in ms */
  latency?: number;
}

// ============================================================================
// Metrics Types
// ============================================================================

/**
 * Metrics data structure.
 */
export interface Metrics {
  /** Uptime in seconds */
  uptime: number;
  /** Health score (0-100) */
  score: number;
  /** Check metrics */
  checks: Record<string, CheckMetrics>;
}

/**
 * Individual check metrics.
 */
export interface CheckMetrics {
  /** Total successful checks */
  success: number;
  /** Total failed checks */
  failure: number;
  /** Average latency in ms */
  avgLatency: number;
  /** Last latency in ms */
  lastLatency: number;
  /** Last status */
  lastStatus: 'healthy' | 'unhealthy' | 'degraded';
}

/**
 * Prometheus metrics output.
 */
export interface PrometheusMetrics {
  /** Health check status metrics */
  status: string;
  /** Latency metrics */
  latency: string;
  /** Total checks counter */
  total: string;
  /** Health score gauge */
  score: string;
  /** Uptime counter */
  uptime: string;
}

// ============================================================================
// Plugin Types
// ============================================================================

/**
 * Plugin interface for extending health check functionality.
 *
 * @typeParam TContext - Shared context type between plugins
 *
 * @example
 * ```typescript
 * const myPlugin: Plugin<HealthContext> = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   dependencies: ['http'],
 *   install: (kernel) => {
 *     // Install plugin
 *   },
 *   onInit: (context) => {
 *     // Initialize
 *   }
 * };
 * ```
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
  /** Called when plugin is unregistered. */
  onDestroy?: () => void | Promise<void>;
  /** Called on error in this plugin. */
  onError?: (error: Error) => void;
}

// ============================================================================
// Kernel Types
// ============================================================================

/**
 * Shared health context available to all plugins.
 */
export interface HealthContext {
  /** Health server instance */
  server?: HealthServer;
  /** Health status */
  status?: HealthStatus;
  /** Registered checks */
  checks: Map<string, CheckConfig>;
  /** Check results */
  results: Map<string, CheckResult>;
  /** Metrics data */
  metrics: Metrics;
  /** Server options */
  options: ServeOptions;
  /** Event bus */
  events: EventBus;
  /** Logger */
  logger: Logger;
}

/**
 * Event bus for inter-plugin communication.
 */
export interface EventBus {
  /** Subscribe to an event */
  on(event: string, handler: (data: unknown) => void): void;
  /** Publish an event */
  emit(event: string, data: unknown): void;
  /** Unsubscribe from an event */
  off(event: string, handler: (data: unknown) => void): void;
  /** Subscribe once */
  once(event: string, handler: (data: unknown) => void): void;
}

/**
 * Simple logger interface.
 */
export interface Logger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  debug(message: string, data?: unknown): void;
}

/**
 * Health kernel interface.
 *
 * @typeParam TContext - Shared context type
 *
 * @example
 * ```typescript
 * const kernel = health.create();
 * kernel.use(httpPlugin);
 * kernel.use(runnerPlugin);
 * kernel.use(aggregatorPlugin);
 * ```
 */
export interface HealthKernel<TContext = HealthContext> {
  /** Get the shared context */
  getContext(): TContext;
  /** Register a plugin */
  use<T extends Plugin<TContext>>(plugin: T): this;
  /** Get a plugin by name */
  getPlugin(name: string): Plugin<TContext> | undefined;
  /** List all registered plugins */
  listPlugins(): string[];
  /** Initialize all plugins */
  init(): Promise<void>;
  /** Destroy all plugins */
  destroy(): Promise<void>;
  /** Emit an event */
  emit(event: string, data: unknown): void;
  /** Subscribe to an event */
  on(event: string, handler: (data: unknown) => void): void;
}

// ============================================================================
// HTTP Types
// ============================================================================

/**
 * HTTP request handler.
 */
export type RequestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => void;

/**
 * Route definition.
 */
export interface Route {
  /** HTTP method */
  method: string;
  /** Route path pattern */
  path: string;
  /** Compiled regex pattern */
  pattern: RegExp;
  /** Handler function */
  handler: RequestHandler;
}

/**
 * Router configuration.
 */
export interface RouterConfig {
  /** Base path for all routes */
  basePath: string;
}

// ============================================================================
// CLI Types
// ============================================================================

/**
 * CLI arguments interface.
 */
export interface CliArgs {
  /** Command to run (serve or check) */
  command: 'serve' | 'check';
  /** Port for serve command */
  port?: number;
  /** Host for serve command */
  host?: string;
  /** Interval between checks */
  interval?: string;
  /** Timeout for checks */
  timeout?: number;
  /** Config file path */
  config?: string;
  /** URL for check command */
  url?: string;
  /** Output format */
  format?: 'json' | 'table' | 'minimal';
  /** Quiet mode */
  quiet?: boolean;
  /** Enable database check */
  checkDb?: boolean;
  /** Enable Redis check */
  checkRedis?: boolean;
  /** Help flag */
  help?: boolean;
  /** Version flag */
  version?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Interval value (string or milliseconds).
 */
export type IntervalValue = string | number;

/**
 * Default values for optional fields.
 */
export interface Defaults {
  /** Default host */
  host: string;
  /** Default base path */
  basePath: string;
  /** Default timeout */
  timeout: number;
  /** Default retries */
  retries: number;
  /** Default interval */
  interval: IntervalValue;
  /** Default healthy threshold */
  healthyThreshold: number;
  /** Default degraded threshold */
  degradedThreshold: number;
}

// ============================================================================
// Exports
// ============================================================================

// All types are already exported above
