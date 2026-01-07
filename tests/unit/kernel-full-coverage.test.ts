/**
 * @oxog/health - Kernel Full Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { httpPlugin } from '../../src/plugins/core/http.js';
import { runnerPlugin } from '../../src/plugins/core/runner.js';
import { aggregatorPlugin } from '../../src/plugins/core/aggregator.js';
import type { Plugin, HealthContext } from '../../src/types.js';

describe('Kernel Event Bus Coverage', () => {
  it('should handle event handler errors gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    // Add handler that throws
    kernel.on('test:event', () => {
      throw new Error('Handler error');
    });

    // Emit should not throw
    kernel.emit('test:event', { data: 'test' });

    expect(errorSpy).toHaveBeenCalled();

    await kernel.destroy();
    errorSpy.mockRestore();
  });

  it('should remove event handlers', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();

    let called = false;
    const handler = () => {
      called = true;
    };

    kernel.on('test:event', handler);
    kernel.emit('test:event', {});
    expect(called).toBe(true);

    // Reset and remove handler
    called = false;
    // Access the event bus through the context to test off()
    const context = kernel.getContext();
    context.events.off('test:event', handler);

    kernel.emit('test:event', {});
    expect(called).toBe(false);

    await kernel.destroy();
  });

  it('should throw when using plugin on destroyed kernel', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    await kernel.init();
    await kernel.destroy();

    const testPlugin: Plugin<HealthContext> = {
      name: 'test-after-destroy',
      version: '1.0.0',
      dependencies: [],
      install: () => {},
    };

    expect(() => kernel.use(testPlugin)).toThrow('Cannot register plugin on destroyed kernel');
  });
});

describe('Kernel Plugin List Coverage', () => {
  it('should list all registered plugins', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    const plugins = kernel.listPlugins();

    expect(plugins).toContain('http');
    expect(plugins).toContain('runner');
    expect(plugins).toContain('aggregator');

    await kernel.destroy();
  });

  it('should get a specific plugin', async () => {
    const kernel = createHealthKernel({ port: 0 });

    kernel.use(httpPlugin);
    kernel.use(runnerPlugin);
    kernel.use(aggregatorPlugin);

    const http = kernel.getPlugin('http');
    expect(http).toBeDefined();
    expect(http?.name).toBe('http');

    const unknown = kernel.getPlugin('unknown');
    expect(unknown).toBeUndefined();

    await kernel.destroy();
  });
});
