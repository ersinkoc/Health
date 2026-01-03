/**
 * @oxog/health - Router
 *
 * Zero-dependency HTTP router with route matching and parameter extraction.
 * @packageDocumentation
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RequestHandler, Route, RouterConfig } from '../types.js';
import { notFound } from '../utils/http.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Route match result.
 */
export interface RouteMatch {
  /** The matched route */
  route: Route;
  /** Extracted path parameters */
  params: Record<string, string>;
  /** Captured groups from regex */
  captures: RegExpExecArray | null;
}

// ============================================================================
// Router Class
// ============================================================================

/**
 * HTTP router with support for path parameters and regex patterns.
 *
 * @example
 * ```typescript
 * const router = new Router({ basePath: '/' });
 * router.get('/health', handler);
 * router.get('/health/:id', handler);
 * router.post('/health', handler);
 * ```
 */
export class Router {
  private routes: Map<string, Route[]> = new Map();
  private readonly basePath: string;
  private readonly middleware: RequestHandler[] = [];

  /**
   * Create a new router.
   *
   * @param config - Router configuration
   */
  constructor(config: Partial<RouterConfig> = {}) {
    this.basePath = config.basePath || '/';
  }

  /**
   * Register a route for GET method.
   */
  get(path: string, handler: RequestHandler): this {
    return this.addRoute('GET', path, handler);
  }

  /**
   * Register a route for POST method.
   */
  post(path: string, handler: RequestHandler): this {
    return this.addRoute('POST', path, handler);
  }

  /**
   * Register a route for PUT method.
   */
  put(path: string, handler: RequestHandler): this {
    return this.addRoute('PUT', path, handler);
  }

  /**
   * Register a route for PATCH method.
   */
  patch(path: string, handler: RequestHandler): this {
    return this.addRoute('PATCH', path, handler);
  }

  /**
   * Register a route for DELETE method.
   */
  delete(path: string, handler: RequestHandler): this {
    return this.addRoute('DELETE', path, handler);
  }

  /**
   * Register a route for HEAD method.
   */
  head(path: string, handler: RequestHandler): this {
    return this.addRoute('HEAD', path, handler);
  }

  /**
   * Register a route for OPTIONS method.
   */
  options(path: string, handler: RequestHandler): this {
    return this.addRoute('OPTIONS', path, handler);
  }

  /**
   * Register a route for all methods.
   */
  all(path: string, handler: RequestHandler): this {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    for (const method of methods) {
      this.addRoute(method, path, handler);
    }
    return this;
  }

  /**
   * Add a route with a specific method.
   */
  addRoute(method: string, path: string, handler: RequestHandler): this {
    const normalizedPath = this.normalizePath(path);
    const pattern = this.pathToRegex(normalizedPath);

    const route: Route = {
      method: method.toUpperCase(),
      path: normalizedPath,
      pattern,
      handler: this.wrapHandler(handler),
    };

    const routes = this.routes.get(method.toUpperCase()) || [];
    routes.push(route);
    this.routes.set(method.toUpperCase(), routes);

    return this;
  }

  /**
   * Add middleware that runs before routes.
   */
  use(handler: RequestHandler): this {
    this.middleware.push(this.wrapHandler(handler));
    return this;
  }

  /**
   * Match a request to a route.
   *
   * @param method - HTTP method
   * @param url - Request URL
   * @returns Route match result or null if not found
   */
  match(method: string, url: string): RouteMatch | null {
    const normalizedUrl = this.normalizePath(url);
    const routes = this.routes.get(method.toUpperCase());

    if (!routes) {
      return null;
    }

    for (const route of routes) {
      const match = route.pattern.exec(normalizedUrl);
      if (match) {
        const params = this.extractParams(route.path, match as RegExpExecArray);
        return { route, params, captures: match as RegExpExecArray };
      }
    }

    return null;
  }

  /**
   * Match any method to a route.
   *
   * @param url - Request URL
   * @returns Route match result or null if not found
   */
  matchAny(url: string): RouteMatch | null {
    const normalizedUrl = this.normalizePath(url);

    for (const routes of this.routes.values()) {
      for (const route of routes) {
        const match = route.pattern.exec(normalizedUrl);
        if (match) {
          const params = this.extractParams(route.path, match as RegExpExecArray);
          return { route, params, captures: match as RegExpExecArray };
        }
      }
    }

    return null;
  }

  /**
   * Handle a request.
   *
   * @param req - Incoming request
   * @param res - Server response
   * @returns True if route was found
   */
  handle(req: IncomingMessage, res: ServerResponse): boolean {
    const method = req.method || 'GET';
    const url = req.url || '/';

    // Run middleware
    for (const mw of this.middleware) {
      mw(req, res);
      if (res.writableEnded) {
        return true;
      }
    }

    // Match route
    const match = this.match(method, url);

    if (match) {
      (req as unknown as Record<string, unknown>).params = match.params;
      match.route.handler(req, res);
      return true;
    }

    return false;
  }

  /**
   * Get all registered routes.
   */
  getRoutes(): Route[] {
    const allRoutes: Route[] = [];
    for (const routes of this.routes.values()) {
      allRoutes.push(...routes);
    }
    return allRoutes;
  }

  /**
   * Get routes for a specific method.
   */
  getRoutesForMethod(method: string): Route[] {
    return this.routes.get(method.toUpperCase()) || [];
  }

  /**
   * Remove a route.
   */
  removeRoute(method: string, path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    const routes = this.routes.get(method.toUpperCase());

    if (!routes) {
      return false;
    }

    const index = routes.findIndex((r) => r.path === normalizedPath);
    if (index === -1) {
      return false;
    }

    routes.splice(index, 1);
    return true;
  }

  /**
   * Clear all routes.
   */
  clear(): this {
    this.routes.clear();
    return this;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Normalize a path by adding base path and removing trailing slashes.
   */
  private normalizePath(path: string): string {
    let normalized = path;

    // Add base path if not already present
    if (this.basePath !== '/' && !normalized.startsWith(this.basePath)) {
      normalized = this.basePath + normalized.replace(/^\//, '');
    }

    // Remove trailing slashes (except for root)
    if (normalized !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    // Ensure leading slash
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }

    return normalized;
  }

  /**
   * Convert a path pattern to a regex.
   */
  private pathToRegex(path: string): RegExp {
    // Replace :param with placeholder first to avoid escaping issues
    const paramNames: string[] = [];
    let regexStr = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name);
      return `__PARAM_${name}__`;
    });

    // Escape special regex characters
    regexStr = regexStr.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

    // Restore parameter patterns with named capture groups
    for (const name of paramNames) {
      regexStr = regexStr.replace(`__PARAM_${name}__`, `(?<${name}>[^/]+)`);
    }

    // Handle wildcard
    regexStr = regexStr.replace(/\*/g, '.*');

    return new RegExp(`^${regexStr}$`);
  }

  /**
   * Extract parameters from a path match.
   */
  private extractParams(path: string, match: RegExpExecArray): Record<string, string> {
    const params: Record<string, string> = {};

    // Extract named groups from regex match
    if (match.groups) {
      for (const [key, value] of Object.entries(match.groups)) {
        params[key] = value || '';
      }
    }

    // Extract positional parameters from :param patterns
    const paramNames: string[] = [];
    const regexStr = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    if (paramNames.length > 0) {
      const routeRegex = new RegExp(`^${regexStr}$`);
      const pathMatch = match[0].match(routeRegex);

      if (pathMatch) {
        for (let i = 0; i < paramNames.length; i++) {
          const paramName = paramNames[i];
          if (paramName === undefined) continue;
          const paramIndex = i + 1;
          if (paramIndex < pathMatch.length) {
            const value = pathMatch[paramIndex];
            if (value !== undefined) {
              params[paramName] = value;
            }
          }
        }
      }
    }

    return params;
  }

  /**
   * Wrap a handler to ensure proper async handling.
   */
  private wrapHandler(handler: RequestHandler): RequestHandler {
    return (req, res) => {
      try {
        const result: unknown = handler(req, res);
        // Check if result is a promise-like object
        if (result && typeof result === 'object' && 'then' in result) {
          (result as Promise<unknown>).catch((error) => {
            console.error('Route handler error:', error);
            if (!res.writableEnded) {
              res.statusCode = 500;
              res.end('Internal Server Error');
            }
          });
        }
      } catch (error) {
        console.error('Route handler error:', error);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new router with default configuration.
 *
 * @example
 * ```typescript
 * const router = createRouter();
 * router.get('/health', handler);
 * ```
 */
export function createRouter(config?: Partial<RouterConfig>): Router {
  return new Router(config);
}
