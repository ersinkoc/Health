/**
 * @oxog/health - HTTP Plugin
 *
 * Core plugin that provides HTTP server functionality.
 * @packageDocumentation
 */

import type { Plugin, HealthContext, ServeOptions, HealthServer } from '../../types.js';
import { createServer } from '../../core/server.js';
import { ServerError } from '../../errors.js';

// ============================================================================
// Plugin
// ============================================================================

/**
 * HTTP plugin that provides the health check HTTP server.
 *
 * This plugin is responsible for:
 * - Creating the HTTP server
 * - Handling incoming requests
 * - Exposing health endpoints
 *
 * @example
 * ```typescript
 * const kernel = createHealthKernel({ port: 9000 });
 * kernel.use(httpPlugin);
 * ```
 */
export const httpPlugin: Plugin<HealthContext> = {
  name: 'http',
  version: '1.0.0',
  dependencies: [],

  install(kernel) {
    const context = kernel.getContext();

    // Create server instance
    const server = createServer(context.options);

    // Store in context
    (context as { server: HealthServer }).server = server;

    // Register default routes
    const basePath = context.options.basePath;

    // Health endpoint
    kernel.on('request:health', async () => {
      return server.status();
    });

    kernel.emit('http:installed', { basePath });
  },

  async onInit(context) {
    const server = (context as { server: HealthServer }).server;

    if (!server) {
      throw new ServerError('HTTP server not initialized');
    }

    await server.start();
    context.logger.info(`HTTP server listening on port ${server.port}`);
  },

  onDestroy() {
    const server = (this as unknown as { context: HealthContext }).context?.server;
    if (server) {
      return server.close();
    }
  },
};

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create an HTTP plugin instance with custom options.
 *
 * @example
 * ```typescript
 * const myHttpPlugin = httpPluginWithOptions({
 *   port: 8080,
 *   host: '127.0.0.1'
 * });
 * kernel.use(myHttpPlugin);
 * ```
 */
export function httpPluginWithOptions(options: Partial<ServeOptions>): Plugin<HealthContext> {
  return {
    name: 'http',
    version: '1.0.0',
    dependencies: [],

    install(kernel) {
      const context = kernel.getContext();
      const mergedOptions = { ...context.options, ...options };
      const server = createServer(mergedOptions);

      (context as { server: HealthServer }).server = server;
      context.options = mergedOptions;
    },

    async onInit(context) {
      const server = (context as { server: HealthServer }).server;
      await server.start();
      context.logger.info(`HTTP server listening on port ${server.port}`);
    },
  };
}
