/**
 * @oxog/health - Test Fixtures
 *
 * Mock health checks for testing.
 */

import type { CheckHandler, CheckResult } from '../src/types.js';

/**
 * Create a successful check.
 */
export function createSuccessfulCheck(delay?: number): CheckHandler {
  return async () => {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return { status: 'healthy', latency: delay || 0 };
  };
}

/**
 * Create a failing check.
 */
export function createFailingCheck(error?: string): CheckHandler {
  return async () => {
    return { status: 'unhealthy', error: error || 'Check failed' };
  };
}

/**
 * Create a degraded check.
 */
export function createDegradedCheck(): CheckHandler {
  return async () => {
    return { status: 'degraded', latency: 1000, metadata: { slow: true } };
  };
}

/**
 * Create a check that throws an error.
 */
export function createThrowingCheck(error?: Error): CheckHandler {
  return async () => {
    throw error || new Error('Check threw error');
  };
}

/**
 * Create a check that times out.
 */
export function createTimeoutCheck(): CheckHandler {
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return { status: 'healthy' };
  };
}

/**
 * Create a database-like check.
 */
export function createDatabaseCheck(connected: boolean = true): CheckHandler {
  return async () => {
    if (!connected) {
      return { status: 'unhealthy', error: 'Connection refused' };
    }
    return { status: 'healthy', latency: 5, metadata: { connections: 10 } };
  };
}

/**
 * Create a Redis-like check.
 */
export function createRedisCheck(connected: boolean = true): CheckHandler {
  return async () => {
    if (!connected) {
      return { status: 'unhealthy', error: 'Redis connection failed' };
    }
    return { status: 'healthy', latency: 2 };
  };
}

/**
 * Create an HTTP API check.
 */
export function createHttpApiCheck(healthy: boolean = true): CheckHandler {
  return async () => {
    if (!healthy) {
      return { status: 'unhealthy', error: 'API returned 500' };
    }
    return { status: 'healthy', latency: 150 };
  };
}

/**
 * Create a custom check with result.
 */
export function createCustomCheck(result: CheckResult): CheckHandler {
  return async () => result;
}
