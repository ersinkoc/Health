/**
 * @oxog/health - Error Definitions
 *
 * Custom error classes and error codes for the health check library.
 * @packageDocumentation
 */

/**
 * Error codes for health check operations.
 */
export const ERROR_CODES = {
  /** Check exceeded timeout */
  CHECK_TIMEOUT: 'CHECK_TIMEOUT',
  /** Check threw an error */
  CHECK_FAILED: 'CHECK_FAILED',
  /** HTTP server error */
  SERVER_ERROR: 'SERVER_ERROR',
  /** Invalid configuration */
  INVALID_CONFIG: 'INVALID_CONFIG',
  /** Plugin error */
  PLUGIN_ERROR: 'PLUGIN_ERROR',
  /** Missing dependency */
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  /** Route not found */
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  /** Invalid interval format */
  INVALID_INTERVAL: 'INVALID_INTERVAL',
  /** Invalid argument */
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  /** Plugin already registered */
  PLUGIN_ALREADY_REGISTERED: 'PLUGIN_ALREADY_REGISTERED',
  /** Server not started */
  SERVER_NOT_STARTED: 'SERVER_NOT_STARTED',
  /** Connection refused */
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  /** Network error */
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/**
 * Error code type.
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Base error class for health check errors.
 *
 * @example
 * ```typescript
 * throw new HealthError('Check failed', 'CHECK_FAILED', { check: 'database' });
 * ```
 */
export class HealthError extends Error {
  /** Error code */
  public readonly code: ErrorCode;
  /** Additional error details */
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode,
    details?: unknown
  ) {
    super(message);
    this.name = 'HealthError';
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, HealthError);
  }

  /**
   * Convert error to JSON.
   */
  toJSON(): { name: string; message: string; code: string; details?: unknown } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }

  /**
   * Create an error from a plain object.
   */
  static fromJSON(json: { message: string; code: string; details?: unknown }): HealthError {
    return new HealthError(json.message, json.code as ErrorCode, json.details);
  }
}

/**
 * Error thrown when a check times out.
 *
 * @example
 * ```typescript
 * throw new CheckTimeoutError('database', 5000);
 * ```
 */
export class CheckTimeoutError extends HealthError {
  /** Name of the check that timed out */
  public readonly checkName: string;
  /** Timeout duration in milliseconds */
  public readonly timeout: number;

  constructor(checkName: string, timeout: number) {
    super(
      `Check '${checkName}' timed out after ${timeout}ms`,
      ERROR_CODES.CHECK_TIMEOUT,
      { checkName, timeout }
    );
    this.name = 'CheckTimeoutError';
    this.checkName = checkName;
    this.timeout = timeout;
    Error.captureStackTrace(this, CheckTimeoutError);
  }
}

/**
 * Error thrown when a check fails.
 *
 * @example
 * ```typescript
 * throw new CheckFailedError('database', new Error('Connection refused'));
 * ```
 */
export class CheckFailedError extends HealthError {
  /** Name of the check that failed */
  public readonly checkName: string;
  /** Original error */
  public readonly cause: Error;

  constructor(checkName: string, cause: Error) {
    super(
      `Check '${checkName}' failed: ${cause.message}`,
      ERROR_CODES.CHECK_FAILED,
      { checkName, cause: cause.message }
    );
    this.name = 'CheckFailedError';
    this.checkName = checkName;
    this.cause = cause;
    Error.captureStackTrace(this, CheckFailedError);
  }
}

/**
 * Error thrown when the server encounters an error.
 *
 * @example
 * ```typescript
 * throw new ServerError('Failed to bind to port 9000');
 * ```
 */
export class ServerError extends HealthError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.SERVER_ERROR, details);
    this.name = 'ServerError';
    Error.captureStackTrace(this, ServerError);
  }
}

/**
 * Error thrown for invalid configuration.
 *
 * @example
 * ```typescript
 * throw new InvalidConfigError('port must be a positive number', { port: -1 });
 * ```
 */
export class InvalidConfigError extends HealthError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.INVALID_CONFIG, details);
    this.name = 'InvalidConfigError';
    Error.captureStackTrace(this, InvalidConfigError);
  }
}

/**
 * Error thrown when a plugin encounters an error.
 *
 * @example
 * ```typescript
 * throw new PluginError('metrics', new Error('Failed to collect metrics'));
 * ```
 */
export class PluginError extends HealthError {
  /** Name of the plugin that errored */
  public readonly pluginName: string;
  /** Original error */
  public readonly cause: Error;

  constructor(pluginName: string, cause: Error) {
    super(
      `Plugin '${pluginName}' error: ${cause.message}`,
      ERROR_CODES.PLUGIN_ERROR,
      { pluginName, cause: cause.message }
    );
    this.name = 'PluginError';
    this.pluginName = pluginName;
    this.cause = cause;
    Error.captureStackTrace(this, PluginError);
  }
}

/**
 * Error thrown when a required dependency is missing.
 *
 * @example
 * ```typescript
 * throw new MissingDependencyError('http', 'metrics');
 * ```
 */
export class MissingDependencyError extends HealthError {
  /** Missing dependency name */
  public readonly dependency: string;
  /** Plugin requiring the dependency */
  public readonly plugin: string;

  constructor(dependency: string, plugin: string) {
    super(
      `Plugin '${plugin}' requires '${dependency}' which is not registered`,
      ERROR_CODES.MISSING_DEPENDENCY,
      { dependency, plugin }
    );
    this.name = 'MissingDependencyError';
    this.dependency = dependency;
    this.plugin = plugin;
    Error.captureStackTrace(this, MissingDependencyError);
  }
}

/**
 * Error thrown when a route is not found.
 *
 * @example
 * ```typescript
 * throw new RouteNotFoundError('GET', '/unknown');
 * ```
 */
export class RouteNotFoundError extends HealthError {
  /** HTTP method */
  public readonly method: string;
  /** Route path */
  public readonly path: string;

  constructor(method: string, path: string) {
    super(
      `Route not found: ${method} ${path}`,
      ERROR_CODES.ROUTE_NOT_FOUND,
      { method, path }
    );
    this.name = 'RouteNotFoundError';
    this.method = method;
    this.path = path;
    Error.captureStackTrace(this, RouteNotFoundError);
  }
}

/**
 * Error thrown for invalid interval format.
 *
 * @example
 * ```typescript
 * throw new InvalidIntervalError('10x');
 * ```
 */
export class InvalidIntervalError extends HealthError {
  /** Invalid interval string */
  public readonly interval: string;

  constructor(interval: string) {
    super(
      `Invalid interval format: '${interval}'. Valid formats: '10s', '5m', '1h', '1d' or number in ms`,
      ERROR_CODES.INVALID_INTERVAL,
      { interval }
    );
    this.name = 'InvalidIntervalError';
    this.interval = interval;
    Error.captureStackTrace(this, InvalidIntervalError);
  }
}

/**
 * Error thrown for invalid arguments.
 *
 * @example
 * ```typescript
 * throw new InvalidArgumentError('port', 'must be a number');
 * ```
 */
export class InvalidArgumentError extends HealthError {
  /** Argument name */
  public readonly argument: string;
  /** Validation message */
  public readonly validation: string;

  constructor(argument: string, validation: string) {
    super(
      `Invalid argument '${argument}': ${validation}`,
      ERROR_CODES.INVALID_ARGUMENT,
      { argument, validation }
    );
    this.name = 'InvalidArgumentError';
    this.argument = argument;
    this.validation = validation;
    Error.captureStackTrace(this, InvalidArgumentError);
  }
}

/**
 * Error thrown when a plugin is already registered.
 *
 * @example
 * ```typescript
 * throw new PluginAlreadyRegisteredError('http');
 * ```
 */
export class PluginAlreadyRegisteredError extends HealthError {
  /** Plugin name */
  public readonly pluginName: string;

  constructor(pluginName: string) {
    super(
      `Plugin '${pluginName}' is already registered`,
      ERROR_CODES.PLUGIN_ALREADY_REGISTERED,
      { pluginName }
    );
    this.name = 'PluginAlreadyRegisteredError';
    this.pluginName = pluginName;
    Error.captureStackTrace(this, PluginAlreadyRegisteredError);
  }
}

/**
 * Error thrown when a network error occurs.
 *
 * @example
 * ```typescript
 * throw new NetworkError('Failed to connect to remote server');
 * ```
 */
export class NetworkError extends HealthError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.NETWORK_ERROR, details);
    this.name = 'NetworkError';
    Error.captureStackTrace(this, NetworkError);
  }
}

/**
 * Error thrown when a connection is refused.
 *
 * @example
 * ```typescript
 * throw new ConnectionRefusedError('localhost', 9000);
 * ```
 */
export class ConnectionRefusedError extends NetworkError {
  /** Host */
  public readonly host: string;
  /** Port */
  public readonly port: number;

  constructor(host: string, port: number) {
    super(
      `Connection refused to ${host}:${port}`,
      { host, port }
    );
    this.name = 'ConnectionRefusedError';
    this.host = host;
    this.port = port;
    Error.captureStackTrace(this, ConnectionRefusedError);
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create a check timeout error.
 */
export function checkTimeout(checkName: string, timeout: number): CheckTimeoutError {
  return new CheckTimeoutError(checkName, timeout);
}

/**
 * Create a check failed error.
 */
export function checkFailed(checkName: string, cause: Error): CheckFailedError {
  return new CheckFailedError(checkName, cause);
}

/**
 * Create a server error.
 */
export function serverError(message: string, details?: unknown): ServerError {
  return new ServerError(message, details);
}

/**
 * Create an invalid config error.
 */
export function invalidConfig(message: string, details?: unknown): InvalidConfigError {
  return new InvalidConfigError(message, details);
}

/**
 * Create a plugin error.
 */
export function pluginError(pluginName: string, cause: Error): PluginError {
  return new PluginError(pluginName, cause);
}

/**
 * Create a missing dependency error.
 */
export function missingDependency(dependency: string, plugin: string): MissingDependencyError {
  return new MissingDependencyError(dependency, plugin);
}

/**
 * Create a route not found error.
 */
export function routeNotFound(method: string, path: string): RouteNotFoundError {
  return new RouteNotFoundError(method, path);
}

/**
 * Create an invalid interval error.
 */
export function invalidInterval(interval: string): InvalidIntervalError {
  return new InvalidIntervalError(interval);
}

/**
 * Create an invalid argument error.
 */
export function invalidArgument(argument: string, validation: string): InvalidArgumentError {
  return new InvalidArgumentError(argument, validation);
}

/**
 * Create a plugin already registered error.
 */
export function pluginAlreadyRegistered(pluginName: string): PluginAlreadyRegisteredError {
  return new PluginAlreadyRegisteredError(pluginName);
}

/**
 * Create a connection refused error.
 */
export function connectionRefused(host: string, port: number): ConnectionRefusedError {
  return new ConnectionRefusedError(host, port);
}

/**
 * Create a network error.
 */
export function networkError(message: string, details?: unknown): NetworkError {
  return new NetworkError(message, details);
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if an error is a HealthError.
 */
export function isHealthError(error: unknown): error is HealthError {
  return error instanceof HealthError;
}

/**
 * Check if an error is a CheckTimeoutError.
 */
export function isCheckTimeoutError(error: unknown): error is CheckTimeoutError {
  return error instanceof CheckTimeoutError;
}

/**
 * Check if an error is a CheckFailedError.
 */
export function isCheckFailedError(error: unknown): error is CheckFailedError {
  return error instanceof CheckFailedError;
}

/**
 * Check if an error is a ServerError.
 */
export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError;
}

/**
 * Check if an error is a NetworkError.
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}
