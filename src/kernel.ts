/**
 * @oxog/health - Micro Kernel
 *
 * Core kernel for plugin lifecycle management and inter-plugin communication.
 * @packageDocumentation
 */

import type {
  Plugin,
  HealthContext,
  HealthKernel,
  EventBus,
  Logger,
  ServeOptions,
  CheckConfig,
  CheckResult,
  Metrics,
} from './types.js';
import {
  HealthError,
  PluginError,
  MissingDependencyError,
  PluginAlreadyRegisteredError,
} from './errors.js';

// ============================================================================
// Default Logger
// ============================================================================

/**
 * Default console logger implementation.
 */
class DefaultLogger implements Logger {
  info(message: string, _data?: unknown): void {
    console.log(`[INFO] ${message}`);
  }

  warn(message: string, _data?: unknown): void {
    console.warn(`[WARN] ${message}`);
  }

  error(message: string, data?: unknown): void {
    console.error(`[ERROR] ${message}`, data ?? '');
  }

  debug(message: string, _data?: unknown): void {
    console.debug(`[DEBUG] ${message}`);
  }
}

// ============================================================================
// Default Event Bus
// ============================================================================

/**
 * Default event bus implementation.
 */
class DefaultEventBus implements EventBus {
  private handlers: Map<string, Set<(data: unknown) => void>> = new Map();

  on(event: string, handler: (data: unknown) => void): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.add(handler);
    } else {
      this.handlers.set(event, new Set([handler]));
    }
  }

  once(event: string, handler: (data: unknown) => void): void {
    const wrapper = (data: unknown) => {
      handler(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  emit(event: string, data: unknown): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      }
    }
  }

  off(event: string, handler: (data: unknown) => void): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }
}

// ============================================================================
// Default Context Factory
// ============================================================================

/**
 * Create a default health context.
 */
function createDefaultContext(options: ServeOptions): HealthContext {
  return {
    checks: new Map(),
    results: new Map(),
    metrics: {
      uptime: 0,
      score: 100,
      checks: {},
    },
    options,
    events: new DefaultEventBus(),
    logger: new DefaultLogger(),
  };
}

// ============================================================================
// Health Kernel Implementation
// ============================================================================

/**
 * Health kernel implementation.
 *
 * Manages plugin lifecycle and provides shared context for all plugins.
 *
 * @example
 * ```typescript
 * const kernel = new HealthKernel({ port: 9000 });
 * kernel.use(httpPlugin);
 * kernel.use(runnerPlugin);
 * kernel.use(aggregatorPlugin);
 * await kernel.init();
 * ```
 */
export class Kernel<TContext = HealthContext> implements HealthKernel<TContext> {
  private plugins: Map<string, Plugin<TContext>> = new Map();
  private context: TContext;
  private initialized: boolean = false;
  private destroyed: boolean = false;
  private readonly logger: Logger;

  constructor(context: TContext) {
    this.context = context;
    this.logger = (context as unknown as { logger: Logger }).logger || new DefaultLogger();
  }

  /**
   * Get the shared context.
   */
  getContext(): TContext {
    return this.context;
  }

  /**
   * Register a plugin.
   */
  use<U extends Plugin<TContext>>(plugin: U): this {
    if (this.destroyed) {
      throw new HealthError(
        'Cannot register plugin on destroyed kernel',
        'PLUGIN_ERROR'
      );
    }

    if (this.plugins.has(plugin.name)) {
      throw new PluginAlreadyRegisteredError(plugin.name);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new MissingDependencyError(dep, plugin.name);
        }
      }
    }

    // Install plugin
    plugin.install(this);
    this.plugins.set(plugin.name, plugin);

    this.logger.info(`Plugin '${plugin.name}' v${plugin.version} registered`);

    return this;
  }

  /**
   * Get a plugin by name.
   */
  getPlugin(name: string): Plugin<TContext> | undefined {
    return this.plugins.get(name);
  }

  /**
   * List all registered plugins.
   */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Initialize all plugins.
   */
  async init(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Kernel already initialized');
      return;
    }

    if (this.destroyed) {
      throw new HealthError(
        'Cannot initialize destroyed kernel',
        'PLUGIN_ERROR'
      );
    }

    this.logger.info('Initializing kernel...');

    // Initialize plugins in dependency order
    const sortedPlugins = this.sortPluginsByDependency();

    for (const plugin of sortedPlugins) {
      try {
        if (plugin.onInit) {
          await plugin.onInit(this.context);
          this.logger.info(`Plugin '${plugin.name}' initialized`);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        throw new PluginError(plugin.name, err);
      }
    }

    this.initialized = true;
    this.logger.info('Kernel initialized successfully');
  }

  /**
   * Destroy all plugins.
   */
  async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.logger.info('Destroying kernel...');

    // Destroy plugins in reverse order
    const plugins = Array.from(this.plugins.values()).reverse();

    for (const plugin of plugins) {
      try {
        if (plugin.onDestroy) {
          await plugin.onDestroy();
          this.logger.info(`Plugin '${plugin.name}' destroyed`);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Error destroying plugin '${plugin.name}':`, err);
      }
    }

    this.plugins.clear();
    this.destroyed = true;
    this.logger.info('Kernel destroyed');
  }

  /**
   * Emit an event to all handlers.
   */
  emit(event: string, data: unknown): void {
    (this.context as HealthContext).events.emit(event, data);
  }

  /**
   * Subscribe to an event.
   */
  on(event: string, handler: (data: unknown) => void): void {
    (this.context as HealthContext).events.on(event, handler);
  }

  /**
   * Check if kernel is initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if kernel is destroyed.
   */
  isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * Sort plugins by dependency order.
   */
  private sortPluginsByDependency(): Plugin<TContext>[] {
    const sorted: Plugin<TContext>[] = [];
    const visited: Set<string> = new Set();

    const visit = (plugin: Plugin<TContext>) => {
      if (visited.has(plugin.name)) {
        return;
      }

      visited.add(plugin.name);

      if (plugin.dependencies) {
        for (const depName of plugin.dependencies) {
          const depPlugin = this.plugins.get(depName);
          if (depPlugin) {
            visit(depPlugin);
          }
        }
      }

      sorted.push(plugin);
    };

    for (const plugin of this.plugins.values()) {
      visit(plugin);
    }

    return sorted;
  }
}

// ============================================================================
// Health Kernel Factory
// ============================================================================

/**
 * Create a new health kernel with default context.
 *
 * @example
 * ```typescript
 * const kernel = createHealthKernel({ port: 9000 });
 * kernel.use(httpPlugin);
 * await kernel.init();
 * ```
 */
export function createHealthKernel(options: ServeOptions): Kernel<HealthContext> {
  const context = createDefaultContext(options);
  return new Kernel<HealthContext>(context);
}

/**
 * Create a kernel with custom context.
 *
 * @example
 * ```typescript
 * const customContext = { ... };
 * const kernel = createKernel(customContext);
 * kernel.use(myPlugin);
 * ```
 */
export function createKernel<TContext>(context: TContext): Kernel<TContext> {
  return new Kernel<TContext>(context);
}
