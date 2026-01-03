import { describe, it, expect } from 'vitest';
import type { CheckResult } from '../../src/types.js';
import {
  historyPlugin,
  historyPluginWithOptions,
  HistoryEntry,
  CheckHistory,
} from '../../src/plugins/optional/history.js';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';

describe('history.ts - Plugin', () => {
  describe('historyPlugin', () => {
    it('should have correct name and version', () => {
      expect(historyPlugin.name).toBe('history');
      expect(historyPlugin.version).toBe('1.0.0');
    });

    it('should have correct dependencies', () => {
      expect(historyPlugin.dependencies).toEqual(['runner']);
    });

    it('should have install method', () => {
      expect(typeof historyPlugin.install).toBe('function');
    });

    it('should have onInit method', () => {
      expect(typeof historyPlugin.onInit).toBe('function');
    });
  });

  describe('historyPluginWithOptions', () => {
    it('should create a plugin with custom options', () => {
      const plugin = historyPluginWithOptions({
        maxEntries: 200,
        maxPerCheck: 100,
      });

      expect(plugin.name).toBe('history');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.dependencies).toEqual(['runner']);
      expect(plugin.install).toBeDefined();
    });

    it('should use default options when not specified', () => {
      const plugin = historyPluginWithOptions({});
      expect(plugin.name).toBe('history');
    });
  });
});

describe('history.ts - Types', () => {
  describe('HistoryEntry', () => {
    it('should have correct structure', () => {
      const entry: HistoryEntry = {
        name: 'test-check',
        result: { status: 'healthy', latency: 5 },
        timestamp: new Date().toISOString(),
        duration: 10,
      };
      expect(entry.name).toBe('test-check');
      expect(entry.result.status).toBe('healthy');
      expect(typeof entry.timestamp).toBe('string');
      expect(entry.duration).toBe(10);
    });
  });

  describe('CheckHistory', () => {
    it('should have overall and perCheck properties', () => {
      const history: CheckHistory = {
        overall: [],
        perCheck: new Map(),
      };
      expect(history.overall).toEqual([]);
      expect(history.perCheck).toBeInstanceOf(Map);
    });
  });
});

describe('history.ts - Integration', () => {
  it('should integrate with kernel', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    // Initialize and verify history context is available
    const context = kernel.getContext() as any;
    expect(context.history).toBeDefined();
    expect(typeof context.history.getHistory).toBe('function');
    expect(typeof context.history.getTrends).toBe('function');
    expect(typeof context.history.clearHistory).toBe('function');

    await kernel.init();
    kernel.destroy();
  });

  it('should track check history when integrated', async () => {
    const kernel = createHealthKernel({ port: 0 });
    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);
    kernel.use(historyPlugin);

    const context = kernel.getContext() as any;

    // Simulate check completed event
    kernel.emit('check:completed', {
      name: 'test-check',
      result: { status: 'healthy' as const, latency: 5 },
      duration: 10,
    });

    const history = context.history.getHistory();
    expect(history.overall).toHaveLength(1);
    expect(history.overall[0].name).toBe('test-check');

    await kernel.init();
    kernel.destroy();
  });
});
