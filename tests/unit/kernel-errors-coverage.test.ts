/**
 * @oxog/health - Kernel Error Handling Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import type { Plugin, HealthContext } from '../../src/types.js';
import { PluginError } from '../../src/errors.js';

describe('Kernel Error Handling Coverage', () => {
  it('should handle plugin init error', async () => {
    const kernel = createHealthKernel({ port: 0 });

    const failingPlugin: Plugin<HealthContext> = {
      name: 'failing-init',
      version: '1.0.0',
      dependencies: [],
      install: () => {},
      onInit: () => {
        throw new Error('Init failed');
      },
    };

    kernel.use(failingPlugin);

    await expect(kernel.init()).rejects.toThrow(PluginError);
  });

  it('should handle plugin init with non-Error object', async () => {
    const kernel = createHealthKernel({ port: 0 });

    const failingPlugin: Plugin<HealthContext> = {
      name: 'failing-init-string',
      version: '1.0.0',
      dependencies: [],
      install: () => {},
      onInit: () => {
        throw 'string error';
      },
    };

    kernel.use(failingPlugin);

    await expect(kernel.init()).rejects.toThrow(PluginError);
  });

  it('should handle plugin destroy error', async () => {
    const loggerErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const kernel = createHealthKernel({ port: 0 });

    const failingPlugin: Plugin<HealthContext> = {
      name: 'failing-destroy',
      version: '1.0.0',
      dependencies: [],
      install: () => {},
      onDestroy: () => {
        throw new Error('Destroy failed');
      },
    };

    kernel.use(failingPlugin);
    await kernel.init();

    // Destroy should not throw but should log error
    await kernel.destroy();

    // Verify it logged the error
    expect(loggerErrorSpy).toHaveBeenCalled();
    loggerErrorSpy.mockRestore();
  });

  it('should handle plugin destroy error with non-Error object', async () => {
    const loggerErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const kernel = createHealthKernel({ port: 0 });

    const failingPlugin: Plugin<HealthContext> = {
      name: 'failing-destroy-string',
      version: '1.0.0',
      dependencies: [],
      install: () => {},
      onDestroy: () => {
        throw 'string error during destroy';
      },
    };

    kernel.use(failingPlugin);
    await kernel.init();

    // Destroy should not throw but should log error
    await kernel.destroy();

    loggerErrorSpy.mockRestore();
  });

  it('should handle async plugin init error', async () => {
    const kernel = createHealthKernel({ port: 0 });

    const failingPlugin: Plugin<HealthContext> = {
      name: 'failing-async-init',
      version: '1.0.0',
      dependencies: [],
      install: () => {},
      onInit: async () => {
        await Promise.resolve();
        throw new Error('Async init failed');
      },
    };

    kernel.use(failingPlugin);

    await expect(kernel.init()).rejects.toThrow(PluginError);
  });

  it('should handle async plugin destroy error', async () => {
    const loggerErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const kernel = createHealthKernel({ port: 0 });

    const failingPlugin: Plugin<HealthContext> = {
      name: 'failing-async-destroy',
      version: '1.0.0',
      dependencies: [],
      install: () => {},
      onDestroy: async () => {
        await Promise.resolve();
        throw new Error('Async destroy failed');
      },
    };

    kernel.use(failingPlugin);
    await kernel.init();

    // Destroy should not throw but should log error
    await kernel.destroy();

    loggerErrorSpy.mockRestore();
  });
});
