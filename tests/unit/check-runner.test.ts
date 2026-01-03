/**
 * @oxog/health - Check Runner Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckRunner, createCheckRunner, simpleCheck, runChecks } from '../../src/core/check-runner.js';
import type { CheckConfig, CheckHandler } from '../../src/types.js';

describe('CheckRunner', () => {
  let runner: CheckRunner;

  beforeEach(() => {
    runner = createCheckRunner({ timeout: 5000, retries: 0 });
  });

  describe('run', () => {
    it('should execute a successful check', async () => {
      const handler: CheckHandler = async () => {
        return { status: 'healthy', latency: 5 };
      };

      const config: CheckConfig = { handler };
      const result = await runner.run('test', config);

      expect(result.name).toBe('test');
      expect(result.result.status).toBe('healthy');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle void return as healthy', async () => {
      const handler: CheckHandler = async () => {
        // No return = success
      };

      const config: CheckConfig = { handler };
      const result = await runner.run('test', config);

      expect(result.result.status).toBe('healthy');
    });

    it('should handle true return as healthy', async () => {
      const handler: CheckHandler = async () => true;

      const config: CheckConfig = { handler };
      const result = await runner.run('test', config);

      expect(result.result.status).toBe('healthy');
    });

    it('should handle false return as unhealthy', async () => {
      const handler: CheckHandler = async () => false;

      const config: CheckConfig = { handler };
      const result = await runner.run('test', config);

      expect(result.result.status).toBe('unhealthy');
    });

    it('should set latency from result', async () => {
      const handler: CheckHandler = async () => {
        return { status: 'healthy', latency: 100 };
      };

      const config: CheckConfig = { handler };
      const result = await runner.run('test', config);

      expect(result.result.latency).toBe(100);
    });
  });

  describe('runAll', () => {
    it('should execute multiple checks in parallel', async () => {
      const checks = new Map<string, CheckConfig>();
      checks.set('check1', { handler: async () => ({ status: 'healthy' }) });
      checks.set('check2', { handler: async () => ({ status: 'healthy' }) });

      const results = await runner.runAll(checks, { parallel: true });

      expect(results.size).toBe(2);
      expect(results.get('check1')?.result.status).toBe('healthy');
      expect(results.get('check2')?.result.status).toBe('healthy');
    });

    it('should execute checks sequentially when parallel is false', async () => {
      const checks = new Map<string, CheckConfig>();
      let executionOrder: number[] = [];

      checks.set('check1', {
        handler: async () => {
          executionOrder.push(1);
          return { status: 'healthy' };
        },
      });
      checks.set('check2', {
        handler: async () => {
          executionOrder.push(2);
          return { status: 'healthy' };
        },
      });

      await runner.runAll(checks, { parallel: false });

      // Sequential execution should complete in order
      expect(executionOrder).toEqual([1, 2]);
    });
  });
});

describe('simpleCheck', () => {
  it('should execute a check without retry', async () => {
    const handler: CheckHandler = async () => ({ status: 'healthy' });
    const result = await simpleCheck(handler, 5000);

    expect(result.status).toBe('healthy');
  });

  it('should throw on error', async () => {
    const handler: CheckHandler = async () => {
      throw new Error('Check failed');
    };

    await expect(simpleCheck(handler, 5000)).rejects.toThrow('Check failed');
  });
});

describe('runChecks', () => {
  it('should run array of checks', async () => {
    const checks = [
      { name: 'check1', config: { handler: async () => ({ status: 'healthy' }) } },
      { name: 'check2', config: { handler: async () => ({ status: 'healthy' }) } },
    ];

    const results = await runChecks(checks);

    expect(results.size).toBe(2);
    expect(results.get('check1')?.result.status).toBe('healthy');
    expect(results.get('check2')?.result.status).toBe('healthy');
  });
});
