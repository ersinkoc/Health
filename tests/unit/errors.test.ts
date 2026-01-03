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
