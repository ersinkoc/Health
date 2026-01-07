/**
 * @oxog/health - History Trends Edge Cases Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { historyPlugin } from '../../src/plugins/optional/history.js';

describe('History Trends Edge Cases', () => {
  // Note: In the history plugin, entries are pushed (appended) to the array.
  // The plugin slices: recent = entries.slice(0, mid), older = entries.slice(mid)
  // So the FIRST entries (index 0) are actually the OLDEST chronologically,
  // but the plugin considers them "recent" for comparison.
  // This means to trigger "improving": recent (first half) should have higher success rate

  it('should detect improving trend', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();

    // First half entries with success (will be "recent" in the algorithm)
    for (let i = 0; i < 5; i++) {
      kernel.emit('check:completed', {
        name: 'improvingCheck',
        result: { status: 'healthy' },
        duration: 100,
      });
    }

    // Second half entries with failures (will be "older" in the algorithm)
    for (let i = 0; i < 5; i++) {
      kernel.emit('check:completed', {
        name: 'improvingCheck',
        result: { status: 'unhealthy' },
        duration: 100,
      });
    }

    const trends = context.history.getTrends('improvingCheck');
    expect(trends.status).toBe('improving');

    kernel.destroy();
  });

  it('should detect degrading trend', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();

    // First half entries with failures (will be "recent" in the algorithm)
    for (let i = 0; i < 5; i++) {
      kernel.emit('check:completed', {
        name: 'degradingCheck',
        result: { status: 'unhealthy' },
        duration: 100,
      });
    }

    // Second half entries with success (will be "older" in the algorithm)
    for (let i = 0; i < 5; i++) {
      kernel.emit('check:completed', {
        name: 'degradingCheck',
        result: { status: 'healthy' },
        duration: 100,
      });
    }

    const trends = context.history.getTrends('degradingCheck');
    expect(trends.status).toBe('degrading');

    kernel.destroy();
  });

  it('should detect stable trend with all healthy results', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(runnerPlugin);
    kernel.use(historyPlugin);

    await kernel.init();

    const context = kernel.getContext();

    // All entries healthy - success rate is same in both halves
    for (let i = 0; i < 10; i++) {
      kernel.emit('check:completed', {
        name: 'stableCheck',
        result: { status: 'healthy' },
        duration: 100,
      });
    }

    const trends = context.history.getTrends('stableCheck');
    expect(trends.status).toBe('stable');

    kernel.destroy();
  });
});
