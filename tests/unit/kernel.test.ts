/**
 * @oxog/health - Kernel Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Kernel, createHealthKernel, createKernel } from '../../src/kernel.js';
import type { Plugin, HealthContext } from '../../src/types.js';

describe('Kernel', () => {
  describe('use', () => {
    it('should register a plugin', () => {
      const kernel = createHealthKernel({ port: 9000 });
      const plugin: Plugin<HealthContext> = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      };

      kernel.use(plugin);

      expect(kernel.getPlugin('test-plugin')).toBe(plugin);
    });

    it('should throw for duplicate plugin', () => {
      const kernel = createHealthKernel({ port: 9000 });
      const plugin: Plugin<HealthContext> = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      };

      kernel.use(plugin);

      expect(() => kernel.use(plugin)).toThrow();
    });

    it('should check dependencies', () => {
      const kernel = createHealthKernel({ port: 9000 });
      const plugin: Plugin<HealthContext> = {
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['missing-plugin'],
        install: vi.fn(),
      };

      expect(() => kernel.use(plugin)).toThrow();
    });

    it('should call plugin install method', () => {
      const kernel = createHealthKernel({ port: 9000 });
      const installFn = vi.fn();
      const plugin: Plugin<HealthContext> = {
        name: 'test-plugin',
        version: '1.0.0',
        install: installFn,
      };

      kernel.use(plugin);

      expect(installFn).toHaveBeenCalledWith(kernel);
    });
  });

  describe('listPlugins', () => {
    it('should list all registered plugins', () => {
      const kernel = createHealthKernel({ port: 9000 });
      const plugin1: Plugin<HealthContext> = { name: 'plugin1', version: '1.0.0', install: vi.fn() };
      const plugin2: Plugin<HealthContext> = { name: 'plugin2', version: '1.0.0', install: vi.fn() };

      kernel.use(plugin1);
      kernel.use(plugin2);

      const plugins = kernel.listPlugins();

      expect(plugins).toEqual(['plugin1', 'plugin2']);
    });
  });

  describe('init', () => {
    it('should initialize all plugins', async () => {
      const kernel = createHealthKernel({ port: 9000 });
      const onInit1 = vi.fn();
      const onInit2 = vi.fn();

      const plugin1: Plugin<HealthContext> = {
        name: 'plugin1',
        version: '1.0.0',
        install: vi.fn(),
        onInit: onInit1,
      };
      const plugin2: Plugin<HealthContext> = {
        name: 'plugin2',
        version: '1.0.0',
        dependencies: ['plugin1'],
        install: vi.fn(),
        onInit: onInit2,
      };

      kernel.use(plugin1);
      kernel.use(plugin2);

      await kernel.init();

      expect(onInit1).toHaveBeenCalled();
      expect(onInit2).toHaveBeenCalled();
    });

    it('should throw on destroyed kernel', async () => {
      const kernel = createHealthKernel({ port: 9000 });
      await kernel.destroy();

      await expect(kernel.init()).rejects.toThrow();
    });

    it('should not initialize twice', async () => {
      const kernel = createHealthKernel({ port: 9000 });
      const onInit = vi.fn();

      const plugin: Plugin<HealthContext> = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        onInit,
      };

      kernel.use(plugin);
      await kernel.init();
      await kernel.init();

      expect(onInit).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('should destroy all plugins', async () => {
      const kernel = createHealthKernel({ port: 9000 });
      const onDestroy1 = vi.fn();
      const onDestroy2 = vi.fn();

      const plugin1: Plugin<HealthContext> = {
        name: 'plugin1',
        version: '1.0.0',
        install: vi.fn(),
        onDestroy: onDestroy1,
      };
      const plugin2: Plugin<HealthContext> = {
        name: 'plugin2',
        version: '1.0.0',
        install: vi.fn(),
        onDestroy: onDestroy2,
      };

      kernel.use(plugin1);
      kernel.use(plugin2);
      await kernel.init();
      await kernel.destroy();

      expect(onDestroy1).toHaveBeenCalled();
      expect(onDestroy2).toHaveBeenCalled();
    });

    it('should clear plugins', async () => {
      const kernel = createHealthKernel({ port: 9000 });
      const plugin: Plugin<HealthContext> = { name: 'test-plugin', version: '1.0.0', install: vi.fn() };

      kernel.use(plugin);
      await kernel.destroy();

      expect(kernel.listPlugins()).toHaveLength(0);
    });

    it('should be idempotent', async () => {
      const kernel = createHealthKernel({ port: 9000 });
      const onDestroy = vi.fn();

      const plugin: Plugin<HealthContext> = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        onDestroy,
      };

      kernel.use(plugin);
      await kernel.init();
      await kernel.destroy();
      await kernel.destroy();

      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getContext', () => {
    it('should return the shared context', () => {
      const kernel = createHealthKernel({ port: 9000 });
      const context = kernel.getContext();

      expect(context).toBeDefined();
      expect(context.options.port).toBe(9000);
    });
  });

  describe('emit/on', () => {
    it('should emit and receive events', async () => {
      const kernel = createHealthKernel({ port: 9000 });
      const handler = vi.fn();

      kernel.on('test-event', handler);
      kernel.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('createKernel', () => {
    it('should create kernel with custom context', () => {
      const customContext = { test: 'value' } as HealthContext;
      const kernel = createKernel(customContext);

      expect(kernel.getContext()).toBe(customContext);
    });
  });
});
