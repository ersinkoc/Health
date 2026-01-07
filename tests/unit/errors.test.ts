/**
 * @oxog/health - Errors Tests
 */

import { describe, it, expect } from 'vitest';
import {
  HealthError,
  CheckTimeoutError,
  CheckFailedError,
  ServerError,
  InvalidConfigError,
  PluginError,
  MissingDependencyError,
  RouteNotFoundError,
  InvalidIntervalError,
  InvalidArgumentError,
  PluginAlreadyRegisteredError,
  ConnectionRefusedError,
  NetworkError,
  ERROR_CODES,
} from '../../src/errors.js';

describe('HealthError', () => {
  it('should create error with code and message', () => {
    const error = new HealthError('Test error', ERROR_CODES.CHECK_FAILED);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('CHECK_FAILED');
    expect(error.name).toBe('HealthError');
  });

  it('should include details', () => {
    const error = new HealthError('Test error', ERROR_CODES.CHECK_FAILED, { check: 'database' });

    expect(error.details).toEqual({ check: 'database' });
  });

  it('should convert to JSON', () => {
    const error = new HealthError('Test error', ERROR_CODES.CHECK_FAILED, { check: 'database' });
    const json = error.toJSON();

    expect(json.name).toBe('HealthError');
    expect(json.message).toBe('Test error');
    expect(json.code).toBe('CHECK_FAILED');
    expect(json.details).toEqual({ check: 'database' });
  });
});

describe('CheckTimeoutError', () => {
  it('should create timeout error', () => {
    const error = new CheckTimeoutError('database', 5000);

    expect(error.message).toBe("Check 'database' timed out after 5000ms");
    expect(error.code).toBe('CHECK_TIMEOUT');
    expect(error.checkName).toBe('database');
    expect(error.timeout).toBe(5000);
  });
});

describe('CheckFailedError', () => {
  it('should create failed error with cause', () => {
    const cause = new Error('Connection refused');
    const error = new CheckFailedError('database', cause);

    expect(error.message).toBe("Check 'database' failed: Connection refused");
    expect(error.code).toBe('CHECK_FAILED');
    expect(error.checkName).toBe('database');
    expect(error.cause).toBe(cause);
  });
});

describe('ServerError', () => {
  it('should create server error', () => {
    const error = new ServerError('Failed to bind port');

    expect(error.message).toBe('Failed to bind port');
    expect(error.code).toBe('SERVER_ERROR');
  });
});

describe('InvalidConfigError', () => {
  it('should create invalid config error', () => {
    const error = new InvalidConfigError('Invalid port', { port: -1 });

    expect(error.message).toBe('Invalid port');
    expect(error.code).toBe('INVALID_CONFIG');
    expect(error.details).toEqual({ port: -1 });
  });
});

describe('PluginError', () => {
  it('should create plugin error', () => {
    const cause = new Error('Plugin failed');
    const error = new PluginError('metrics', cause);

    expect(error.message).toBe("Plugin 'metrics' error: Plugin failed");
    expect(error.code).toBe('PLUGIN_ERROR');
    expect(error.pluginName).toBe('metrics');
    expect(error.cause).toBe(cause);
  });
});

describe('MissingDependencyError', () => {
  it('should create missing dependency error', () => {
    const error = new MissingDependencyError('http', 'metrics');

    expect(error.message).toBe("Plugin 'metrics' requires 'http' which is not registered");
    expect(error.code).toBe('MISSING_DEPENDENCY');
    expect(error.dependency).toBe('http');
    expect(error.plugin).toBe('metrics');
  });
});

describe('RouteNotFoundError', () => {
  it('should create route not found error', () => {
    const error = new RouteNotFoundError('GET', '/unknown');

    expect(error.message).toBe('Route not found: GET /unknown');
    expect(error.code).toBe('ROUTE_NOT_FOUND');
    expect(error.method).toBe('GET');
    expect(error.path).toBe('/unknown');
  });
});

describe('InvalidIntervalError', () => {
  it('should create invalid interval error', () => {
    const error = new InvalidIntervalError('10x');

    expect(error.message).toBe("Invalid interval format: '10x'. Valid formats: '10s', '5m', '1h', '1d' or number in ms");
    expect(error.code).toBe('INVALID_INTERVAL');
    expect(error.interval).toBe('10x');
  });
});

describe('InvalidArgumentError', () => {
  it('should create invalid argument error', () => {
    const error = new InvalidArgumentError('port', 'must be a positive number');

    expect(error.message).toBe("Invalid argument 'port': must be a positive number");
    expect(error.code).toBe('INVALID_ARGUMENT');
    expect(error.argument).toBe('port');
    expect(error.validation).toBe('must be a positive number');
  });
});

describe('PluginAlreadyRegisteredError', () => {
  it('should create plugin already registered error', () => {
    const error = new PluginAlreadyRegisteredError('http');

    expect(error.message).toBe("Plugin 'http' is already registered");
    expect(error.code).toBe('PLUGIN_ALREADY_REGISTERED');
    expect(error.pluginName).toBe('http');
  });
});

describe('ConnectionRefusedError', () => {
  it('should create connection refused error', () => {
    const error = new ConnectionRefusedError('localhost', 9000);

    expect(error.message).toBe('Connection refused to localhost:9000');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.host).toBe('localhost');
    expect(error.port).toBe(9000);
  });
});

describe('NetworkError', () => {
  it('should create network error', () => {
    const error = new NetworkError('Network unreachable');

    expect(error.message).toBe('Network unreachable');
    expect(error.code).toBe('NETWORK_ERROR');
  });
});

describe('Error codes', () => {
  it('should have all expected error codes', () => {
    expect(ERROR_CODES.CHECK_TIMEOUT).toBe('CHECK_TIMEOUT');
    expect(ERROR_CODES.CHECK_FAILED).toBe('CHECK_FAILED');
    expect(ERROR_CODES.SERVER_ERROR).toBe('SERVER_ERROR');
    expect(ERROR_CODES.INVALID_CONFIG).toBe('INVALID_CONFIG');
    expect(ERROR_CODES.PLUGIN_ERROR).toBe('PLUGIN_ERROR');
    expect(ERROR_CODES.MISSING_DEPENDENCY).toBe('MISSING_DEPENDENCY');
    expect(ERROR_CODES.ROUTE_NOT_FOUND).toBe('ROUTE_NOT_FOUND');
    expect(ERROR_CODES.INVALID_INTERVAL).toBe('INVALID_INTERVAL');
    expect(ERROR_CODES.INVALID_ARGUMENT).toBe('INVALID_ARGUMENT');
    expect(ERROR_CODES.PLUGIN_ALREADY_REGISTERED).toBe('PLUGIN_ALREADY_REGISTERED');
    expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
  });
});

// Import factory functions and type guards
import {
  checkTimeout,
  checkFailed,
  serverError,
  invalidConfig,
  pluginError,
  missingDependency,
  routeNotFound,
  invalidInterval,
  invalidArgument,
  pluginAlreadyRegistered,
  connectionRefused,
  networkError,
  isHealthError,
  isCheckTimeoutError,
  isCheckFailedError,
  isServerError,
  isNetworkError,
} from '../../src/errors.js';

describe('Error Factory Functions', () => {
  it('checkTimeout should create CheckTimeoutError', () => {
    const error = checkTimeout('db', 3000);
    expect(error).toBeInstanceOf(CheckTimeoutError);
    expect(error.checkName).toBe('db');
    expect(error.timeout).toBe(3000);
  });

  it('checkFailed should create CheckFailedError', () => {
    const cause = new Error('Failed');
    const error = checkFailed('redis', cause);
    expect(error).toBeInstanceOf(CheckFailedError);
    expect(error.checkName).toBe('redis');
    expect(error.cause).toBe(cause);
  });

  it('serverError should create ServerError', () => {
    const error = serverError('Port in use', { port: 3000 });
    expect(error).toBeInstanceOf(ServerError);
    expect(error.message).toBe('Port in use');
    expect(error.details).toEqual({ port: 3000 });
  });

  it('invalidConfig should create InvalidConfigError', () => {
    const error = invalidConfig('Bad config', { field: 'port' });
    expect(error).toBeInstanceOf(InvalidConfigError);
    expect(error.message).toBe('Bad config');
  });

  it('pluginError should create PluginError', () => {
    const cause = new Error('Init failed');
    const error = pluginError('metrics', cause);
    expect(error).toBeInstanceOf(PluginError);
    expect(error.pluginName).toBe('metrics');
  });

  it('missingDependency should create MissingDependencyError', () => {
    const error = missingDependency('http', 'metrics');
    expect(error).toBeInstanceOf(MissingDependencyError);
    expect(error.dependency).toBe('http');
    expect(error.plugin).toBe('metrics');
  });

  it('routeNotFound should create RouteNotFoundError', () => {
    const error = routeNotFound('POST', '/api');
    expect(error).toBeInstanceOf(RouteNotFoundError);
    expect(error.method).toBe('POST');
    expect(error.path).toBe('/api');
  });

  it('invalidInterval should create InvalidIntervalError', () => {
    const error = invalidInterval('bad');
    expect(error).toBeInstanceOf(InvalidIntervalError);
    expect(error.interval).toBe('bad');
  });

  it('invalidArgument should create InvalidArgumentError', () => {
    const error = invalidArgument('timeout', 'must be positive');
    expect(error).toBeInstanceOf(InvalidArgumentError);
    expect(error.argument).toBe('timeout');
  });

  it('pluginAlreadyRegistered should create PluginAlreadyRegisteredError', () => {
    const error = pluginAlreadyRegistered('http');
    expect(error).toBeInstanceOf(PluginAlreadyRegisteredError);
    expect(error.pluginName).toBe('http');
  });

  it('connectionRefused should create ConnectionRefusedError', () => {
    const error = connectionRefused('127.0.0.1', 8080);
    expect(error).toBeInstanceOf(ConnectionRefusedError);
    expect(error.host).toBe('127.0.0.1');
    expect(error.port).toBe(8080);
  });

  it('networkError should create NetworkError', () => {
    const error = networkError('DNS failed', { code: 'ENOTFOUND' });
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe('DNS failed');
  });
});

describe('Type Guards', () => {
  it('isHealthError should return true for HealthError', () => {
    const error = new HealthError('test', ERROR_CODES.CHECK_FAILED);
    expect(isHealthError(error)).toBe(true);
    expect(isHealthError(new Error('test'))).toBe(false);
    expect(isHealthError(null)).toBe(false);
    expect(isHealthError('string')).toBe(false);
  });

  it('isCheckTimeoutError should return true for CheckTimeoutError', () => {
    const error = new CheckTimeoutError('db', 1000);
    expect(isCheckTimeoutError(error)).toBe(true);
    expect(isCheckTimeoutError(new Error('test'))).toBe(false);
  });

  it('isCheckFailedError should return true for CheckFailedError', () => {
    const error = new CheckFailedError('db', new Error('fail'));
    expect(isCheckFailedError(error)).toBe(true);
    expect(isCheckFailedError(new Error('test'))).toBe(false);
  });

  it('isServerError should return true for ServerError', () => {
    const error = new ServerError('test');
    expect(isServerError(error)).toBe(true);
    expect(isServerError(new Error('test'))).toBe(false);
  });

  it('isNetworkError should return true for NetworkError', () => {
    const error = new NetworkError('test');
    expect(isNetworkError(error)).toBe(true);
    expect(isNetworkError(new Error('test'))).toBe(false);
  });
});
