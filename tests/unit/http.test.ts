import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  getHeader,
  getHeaders,
  getMethod,
  getPathname,
  getQuery,
  getBody,
  getJsonBody,
  parseAcceptHeader,
  setStatus,
  setHeader,
  setHeaders,
  json,
  text,
  html,
  noContent,
  redirect,
  error,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  serviceUnavailable,
  respond,
  parseUrl,
  buildUrl,
} from '../../src/utils/http.js';

describe('http.ts - Request Utilities', () => {
  describe('getHeader', () => {
    it('should get header case-insensitively', () => {
      // Node.js HTTP headers are lowercase
      const req = {
        headers: {
          'content-type': 'application/json',
          'x-custom-header': 'value',
        },
      } as unknown as IncomingMessage;

      expect(getHeader(req, 'content-type')).toBe('application/json');
      expect(getHeader(req, 'Content-Type')).toBe('application/json');
      expect(getHeader(req, 'x-custom-header')).toBe('value');
      expect(getHeader(req, 'X-CUSTOM-HEADER')).toBe('value');
      expect(getHeader(req, 'missing')).toBeUndefined();
    });
  });

  describe('getHeaders', () => {
    it('should return all headers as plain object', () => {
      const req = {
        headers: {
          'content-type': 'application/json',
          'x-custom': ['val1', 'val2'],
        },
      } as unknown as IncomingMessage;

      const headers = getHeaders(req);
      expect(headers['content-type']).toBe('application/json');
      expect(headers['x-custom']).toBe('val1, val2');
    });
  });

  describe('getMethod', () => {
    it('should return method', () => {
      const req = { method: 'POST' } as unknown as IncomingMessage;
      expect(getMethod(req)).toBe('POST');
    });

    it('should return GET as default', () => {
      const req = {} as unknown as IncomingMessage;
      expect(getMethod(req)).toBe('GET');
    });
  });

  describe('getPathname', () => {
    it('should extract pathname from URL', () => {
      const req = {
        url: '/health/check?status=ok',
        headers: { host: 'localhost' },
      } as unknown as IncomingMessage;
      expect(getPathname(req)).toBe('/health/check');
    });

    it('should handle root URL', () => {
      const req = { url: '/', headers: {} } as unknown as IncomingMessage;
      expect(getPathname(req)).toBe('/');
    });
  });

  describe('getQuery', () => {
    it('should parse query parameters', () => {
      const req = {
        url: '/api?foo=bar&baz=qux',
        headers: { host: 'localhost' },
      } as unknown as IncomingMessage;

      const query = getQuery(req);
      expect(query.foo).toBe('bar');
      expect(query.baz).toBe('qux');
    });

    it('should return empty object for no query', () => {
      const req = { url: '/api', headers: {} } as unknown as IncomingMessage;
      expect(getQuery(req)).toEqual({});
    });
  });

  describe('getBody', () => {
    it('should exist and be async', () => {
      expect(typeof getBody).toBe('function');
    });
  });

  describe('getJsonBody', () => {
    it('should exist and be async', () => {
      expect(typeof getJsonBody).toBe('function');
    });

    it('should return undefined for empty body', async () => {
      const req = {
        on: (event: string, handler: () => void) => {
          if (event === 'end') handler();
        },
      } as unknown as IncomingMessage;

      const body = await getJsonBody(req);
      expect(body).toBeUndefined();
    });
  });

  describe('parseAcceptHeader', () => {
    it('should parse application/json', () => {
      const req = {
        headers: { accept: 'application/json' },
      } as unknown as IncomingMessage;
      expect(parseAcceptHeader(req)).toBe('json');
    });

    it('should parse text/html', () => {
      const req = {
        headers: { accept: 'text/html' },
      } as unknown as IncomingMessage;
      expect(parseAcceptHeader(req)).toBe('html');
    });

    it('should parse text/plain', () => {
      const req = {
        headers: { accept: 'text/plain' },
      } as unknown as IncomingMessage;
      expect(parseAcceptHeader(req)).toBe('text');
    });

    it('should return */* for unknown types', () => {
      const req = {
        headers: { accept: 'image/png' },
      } as unknown as IncomingMessage;
      expect(parseAcceptHeader(req)).toBe('*/*');
    });

    it('should handle +json suffix', () => {
      const req = {
        headers: { accept: 'application/vnd.api+json' },
      } as unknown as IncomingMessage;
      expect(parseAcceptHeader(req)).toBe('json');
    });
  });
});

describe('http.ts - Response Utilities', () => {
  let mockRes: { setHeader: jest.Mock; statusCode: number; end: jest.Mock; writeHead?: jest.Mock };

  beforeEach(() => {
    mockRes = {
      setHeader: vi.fn(),
      statusCode: 200,
      end: vi.fn(),
    };
  });

  describe('setStatus', () => {
    it('should set status code', () => {
      setStatus(mockRes as unknown as ServerResponse, 404);
      expect(mockRes.statusCode).toBe(404);
    });
  });

  describe('setHeader', () => {
    it('should set single header', () => {
      setHeader(mockRes as unknown as ServerResponse, 'Content-Type', 'application/json');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    });
  });

  describe('setHeaders', () => {
    it('should set multiple headers', () => {
      setHeaders(mockRes as unknown as ServerResponse, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      });
      expect(mockRes.setHeader).toHaveBeenCalledTimes(2);
    });
  });

  describe('json', () => {
    it('should send JSON response', () => {
      json(mockRes as unknown as ServerResponse, { status: 'ok' });
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.end).toHaveBeenCalledWith('{"status":"ok"}');
    });
  });

  describe('text', () => {
    it('should send text response', () => {
      text(mockRes as unknown as ServerResponse, 'Hello');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
      expect(mockRes.end).toHaveBeenCalledWith('Hello');
    });

    it('should accept custom status code', () => {
      text(mockRes as unknown as ServerResponse, 'Error', 500);
      expect(mockRes.statusCode).toBe(500);
    });
  });

  describe('html', () => {
    it('should send HTML response', () => {
      html(mockRes as unknown as ServerResponse, '<h1>Hello</h1>');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
    });
  });

  describe('noContent', () => {
    it('should send 204 response', () => {
      noContent(mockRes as unknown as ServerResponse);
      expect(mockRes.statusCode).toBe(204);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('redirect', () => {
    it('should send redirect response', () => {
      redirect(mockRes as unknown as ServerResponse, '/new-location', 301);
      expect(mockRes.statusCode).toBe(301);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Location', '/new-location');
    });

    it('should use 302 as default', () => {
      redirect(mockRes as unknown as ServerResponse, '/other');
      expect(mockRes.statusCode).toBe(302);
    });
  });

  describe('error', () => {
    it('should send error response', () => {
      error(mockRes as unknown as ServerResponse, 500, 'Internal Error');
      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    });
  });

  describe('notFound', () => {
    it('should send 404 response', () => {
      notFound(mockRes as unknown as ServerResponse);
      expect(mockRes.statusCode).toBe(404);
    });

    it('should accept custom message', () => {
      notFound(mockRes as unknown as ServerResponse, 'Custom not found');
      expect(mockRes.end).toHaveBeenCalledWith(expect.stringContaining('Custom not found'));
    });
  });

  describe('badRequest', () => {
    it('should send 400 response', () => {
      badRequest(mockRes as unknown as ServerResponse, 'Invalid input');
      expect(mockRes.statusCode).toBe(400);
    });
  });

  describe('unauthorized', () => {
    it('should send 401 response', () => {
      unauthorized(mockRes as unknown as ServerResponse);
      expect(mockRes.statusCode).toBe(401);
    });
  });

  describe('forbidden', () => {
    it('should send 403 response', () => {
      forbidden(mockRes as unknown as ServerResponse);
      expect(mockRes.statusCode).toBe(403);
    });
  });

  describe('serviceUnavailable', () => {
    it('should send 503 response', () => {
      serviceUnavailable(mockRes as unknown as ServerResponse);
      expect(mockRes.statusCode).toBe(503);
    });
  });

  describe('respond', () => {
    it('should respond with json when accept is json', () => {
      const req = {
        headers: { accept: 'application/json' },
      } as unknown as IncomingMessage;

      respond(mockRes as unknown as ServerResponse, req, { json: { data: 'test' } });
      expect(mockRes.end).toHaveBeenCalledWith('{"data":"test"}');
    });

    it('should respond with html when accept is html', () => {
      const req = {
        headers: { accept: 'text/html' },
      } as unknown as IncomingMessage;

      respond(mockRes as unknown as ServerResponse, req, { html: '<h1>test</h1>' });
      expect(mockRes.end).toHaveBeenCalledWith('<h1>test</h1>');
    });

    it('should fallback to text', () => {
      const req = {
        headers: { accept: 'text/plain' },
      } as unknown as IncomingMessage;

      respond(mockRes as unknown as ServerResponse, req, { text: 'plain text' });
      expect(mockRes.end).toHaveBeenCalledWith('plain text');
    });
  });
});

describe('http.ts - URL Utilities', () => {
  describe('parseUrl', () => {
    it('should parse full URL', () => {
      const parsed = parseUrl('https://example.com:8080/path?query=value');
      expect(parsed.protocol).toBe('https:');
      expect(parsed.hostname).toBe('example.com');
      expect(parsed.port).toBe(8080);
      expect(parsed.pathname).toBe('/path');
      expect(parsed.search).toBe('?query=value');
    });

    it('should use default port for https', () => {
      const parsed = parseUrl('https://example.com/path');
      expect(parsed.port).toBe(443);
    });

    it('should use default port for http', () => {
      const parsed = parseUrl('http://example.com/path');
      expect(parsed.port).toBe(80);
    });
  });

  describe('buildUrl', () => {
    it('should build URL from components', () => {
      const url = buildUrl({ hostname: 'example.com', port: 8080, pathname: '/health' });
      expect(url).toBe('http://example.com:8080/health');
    });

    it('should use https when specified', () => {
      const url = buildUrl({ protocol: 'https', hostname: 'example.com' });
      expect(url).toBe('https://example.com');
    });

    it('should omit port when not specified', () => {
      const url = buildUrl({ hostname: 'example.com' });
      expect(url).toBe('http://example.com');
    });

    it('should include search query', () => {
      const url = buildUrl({ hostname: 'example.com', search: '?status=ok' });
      expect(url).toBe('http://example.com?status=ok');
    });
  });
});
