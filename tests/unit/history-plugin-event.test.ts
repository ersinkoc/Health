/**
 * @oxog/health - History Plugin Event Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { historyPlugin } from '../../src/plugins/optional/history.js';
import { sleep } from '../../src/utils/promise.js';

describe('History Plugin check:completed Event', () => {
  it('should record history when check:completed event is emitted', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();

    // Emit check:completed event to trigger history recording
    kernel.emit('check:completed', {
      name: 'testCheck',
      result: { status: 'healthy' },
      duration: 50,
    });

    await sleep(10);

    // Check that history was recorded
    const history = context.history.getOverallHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);

    const lastEntry = history[history.length - 1];
    expect(lastEntry.name).toBe('testCheck');
    expect(lastEntry.result.status).toBe('healthy');
    expect(lastEntry.duration).toBe(50);

    kernel.destroy();
  });

  it('should record per-check history', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();

    // Emit multiple events for different checks
    kernel.emit('check:completed', {
      name: 'dbCheck',
      result: { status: 'healthy' },
      duration: 100,
    });

    kernel.emit('check:completed', {
      name: 'cacheCheck',
      result: { status: 'degraded' },
      duration: 200,
    });

    kernel.emit('check:completed', {
      name: 'dbCheck',
      result: { status: 'healthy' },
      duration: 120,
    });

    await sleep(10);

    // Check per-check history
    const dbHistory = context.history.getCheckHistory('dbCheck');
    expect(dbHistory.length).toBe(2);

    const cacheHistory = context.history.getCheckHistory('cacheCheck');
    expect(cacheHistory.length).toBe(1);

    kernel.destroy();
  });

  it('should compute trends from history', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();

    // Emit multiple events
    for (let i = 0; i < 5; i++) {
      kernel.emit('check:completed', {
        name: 'apiCheck',
        result: { status: 'healthy' },
        duration: 100 + i * 10,
      });
    }

    await sleep(10);

    const trends = context.history.getTrends('apiCheck');
    expect(trends.successRate).toBe(100);
    expect(trends.status).toBe('stable');

    kernel.destroy();
  });
});
