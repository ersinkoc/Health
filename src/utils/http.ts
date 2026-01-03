/**
 * @oxog/health - HTTP Utilities
 *
 * Zero-dependency HTTP utilities for request/response handling.
 * @packageDocumentation
 */

import type { IncomingMessage, ServerResponse } from 'http';

// ============================================================================
// Request Utilities
// ============================================================================

/**
 * Get a request header by name (case-insensitive).
 *
 * @example
 * ```typescript
 * const contentType = getHeader(req, 'content-type');
 * ```
 */
export function getHeader(req: IncomingMessage, name: string): string | undefined {
  return req.headers[name.toLowerCase() as keyof typeof req.headers] as string | undefined;
}

/**
 * Get all request headers as a plain object.
 *
 * @example
 * ```typescript
 * const headers = getHeaders(req);
 * ```
 */
export function getHeaders(req: IncomingMessage): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }
  }
  return headers;
}

/**
 * Get the request method.
 *
 * @example
 * ```typescript
 * const method = getMethod(req);
 * ```
 */
export function getMethod(req: IncomingMessage): string {
  return req.method || 'GET';
}

/**
 * Get the request URL pathname.
 *
 * @example
 * ```typescript
 * const path = getPathname(req);
 * ```
 */
export function getPathname(req: IncomingMessage): string {
  const url = req.url || '/';
  const parsed = new URL(url, `http://${req.headers.host || 'localhost'}`);
  return parsed.pathname;
}

/**
 * Get the request URL query string.
 *
 * @example
 * ```typescript
 * const query = getQuery(req);
 * ```
 */
export function getQuery(req: IncomingMessage): Record<string, string> {
  const url = req.url || '/';
  const parsed = new URL(url, `http://${req.headers.host || 'localhost'}`);
  const query: Record<string, string> = {};

  for (const [key, value] of parsed.searchParams.entries()) {
    query[key] = value;
  }

  return query;
}

/**
 * Get the request body as text.
 */
export async function getBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}

/**
 * Get the request body as JSON.
 */
export async function getJsonBody(req: IncomingMessage): Promise<unknown> {
  const body = await getBody(req);
  if (!body) {
    return undefined;
  }
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

/**
 * Parse the Accept header to get preferred content type.
 *
 * @example
 * ```typescript
 * const accept = parseAcceptHeader(req);
 * // Returns: 'json' | 'text' | 'html' | any
 * ```
 */
export function parseAcceptHeader(req: IncomingMessage): 'json' | 'text' | 'html' | 'any' {
  const accept = getHeader(req, 'accept') || '*/*';

  if (accept.includes('application/json') || accept.includes('+json')) {
    return 'json';
  }
  if (accept.includes('text/html')) {
    return 'html';
  }
  if (accept.includes('text/') || accept.includes('application/text')) {
    return 'text';
  }

  return '*/*';
}

// ============================================================================
// Response Utilities
// ============================================================================

/**
 * Set the HTTP status code.
 *
 * @example
 * ```typescript
 * setStatus(res, 200);
 * ```
 */
export function setStatus(res: ServerResponse, code: number): void {
  res.statusCode = code;
}

/**
 * Set a response header.
 *
 * @example
 * ```typescript
 * setHeader(res, 'content-type', 'application/json');
 * ```
 */
export function setHeader(res: ServerResponse, name: string, value: string): void {
  res.setHeader(name, value);
}

/**
 * Set multiple response headers.
 *
 * @example
 * ```typescript
 * setHeaders(res, {
 *   'content-type': 'application/json',
 *   'cache-control': 'no-cache'
 * });
 * ```
 */
export function setHeaders(res: ServerResponse, headers: Record<string, string>): void {
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
  }
}

/**
 * Send a JSON response.
 *
 * @example
 * ```typescript
 * json(res, { status: 'healthy' });
 * ```
 */
export function json(res: ServerResponse, data: unknown): void {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

/**
 * Send a text response.
 *
 * @example
 * ```typescript
 * text(res, 'Hello, World!');
 * ```
 */
export function text(res: ServerResponse, data: string, statusCode: number = 200): void {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.statusCode = statusCode;
  res.end(data);
}

/**
 * Send an HTML response.
 *
 * @example
 * ```typescript
 * html(res, '<h1>Hello!</h1>');
 * ```
 */
export function html(res: ServerResponse, data: string, statusCode: number = 200): void {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.statusCode = statusCode;
  res.end(data);
}

/**
 * Send a no-content response.
 *
 * @example
 * ```typescript
 * noContent(res);
 * ```
 */
export function noContent(res: ServerResponse): void {
  res.statusCode = 204;
  res.end();
}

/**
 * Send a redirect response.
 *
 * @example
 * ```typescript
 * redirect(res, '/new-location', 301);
 * ```
 */
export function redirect(res: ServerResponse, location: string, statusCode: number = 302): void {
  res.setHeader('Location', location);
  res.statusCode = statusCode;
  res.end();
}

/**
 * Send an error response.
 *
 * @example
 * ```typescript
 * error(res, 500, 'Internal Server Error');
 * ```
 */
export function error(res: ServerResponse, statusCode: number, message: string): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    error: message,
    status: statusCode,
  }));
}

/**
 * Send a not found response.
 *
 * @example
 * ```typescript
 * notFound(res, 'Endpoint not found');
 * ```
 */
export function notFound(res: ServerResponse, message: string = 'Not Found'): void {
  error(res, 404, message);
}

/**
 * Send a bad request response.
 *
 * @example
 * ```typescript
 * badRequest(res, 'Invalid request');
 * ```
 */
export function badRequest(res: ServerResponse, message: string): void {
  error(res, 400, message);
}

/**
 * Send an unauthorized response.
 *
 * @example
 * ```typescript
 * unauthorized(res, 'Authentication required');
 * ```
 */
export function unauthorized(res: ServerResponse, message: string = 'Unauthorized'): void {
  error(res, 401, message);
}

/**
 * Send a forbidden response.
 *
 * @example
 * ```typescript
 * forbidden(res, 'Access denied');
 * ```
 */
export function forbidden(res: ServerResponse, message: string = 'Forbidden'): void {
  error(res, 403, message);
}

/**
 * Send a service unavailable response.
 *
 * @example
 * ```typescript
 * serviceUnavailable(res, 'Service temporarily unavailable');
 * ```
 */
export function serviceUnavailable(res: ServerResponse, message: string = 'Service Unavailable'): void {
  error(res, 503, message);
}

// ============================================================================
// Content Negotiation
// ============================================================================

/**
 * Send response with content negotiation.
 *
 * @example
 * ```typescript
 * respond(res, req, {
 *   json: { status: 'healthy' },
 *   text: 'healthy',
 *   html: '<h1>healthy</h1>'
 * });
 * ```
 */
export function respond(
  res: ServerResponse,
  req: IncomingMessage,
  content: { json?: unknown; text?: string; html?: string }
): void {
  const accept = parseAcceptHeader(req);

  if (accept === 'json' && content.json !== undefined) {
    json(res, content.json);
    return;
  }

  if (accept === 'html' && content.html !== undefined) {
    html(res, content.html);
    return;
  }

  if (content.text !== undefined) {
    text(res, content.text);
    return;
  }

  if (content.json !== undefined) {
    json(res, content.json);
    return;
  }

  notFound(res, 'No suitable content type');
}

// ============================================================================
// URL Parsing
// ============================================================================

/**
 * Parse a URL string into components.
 *
 * @example
 * ```typescript
 * const parsed = parseUrl('https://example.com:8080/path?query=value');
 * // { protocol: 'https:', hostname: 'example.com', port: 8080, pathname: '/path', search: '?query=value' }
 * ```
 */
export function parseUrl(url: string): {
  protocol: string;
  hostname: string;
  port: number;
  pathname: string;
  search: string;
  hash: string;
} {
  const parsed = new URL(url);
  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80),
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
  };
}

/**
 * Build a URL from components.
 *
 * @example
 * ```typescript
 * const url = buildUrl({ hostname: 'example.com', port: 8080, pathname: '/health' });
 * // 'http://example.com:8080/health'
 * ```
 */
export function buildUrl(options: {
  protocol?: string;
  hostname: string;
  port?: number;
  pathname?: string;
  search?: string;
}): string {
  const protocol = options.protocol || 'http';
  const port = options.port !== undefined ? `:${options.port}` : '';
  const search = options.search || '';
  return `${protocol}://${options.hostname}${port}${options.pathname || ''}${search}`;
}
