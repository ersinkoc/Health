/**
 * @oxog/health - Router Not Found Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createRouter } from '../../src/core/router.js';
import type { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';

function createMockRequest(method: string, url: string): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = {};
  return req;
}

function createMockResponse(): ServerResponse & { _data: string; _statusCode: number } {
  const res = new EventEmitter() as ServerResponse & {
    _data: string;
    _statusCode: number;
    writableEnded: boolean;
  };
  res._data = '';
  res._statusCode = 200;
  res.writableEnded = false;

  res.setHeader = vi.fn().mockReturnThis();
  res.end = vi.fn((data?: string) => {
    res._data = data || '';
    res.writableEnded = true;
    return res;
  });

  Object.defineProperty(res, 'statusCode', {
    get() {
      return res._statusCode;
    },
    set(value: number) {
      res._statusCode = value;
    },
  });

  return res;
}

describe('Router Not Found Coverage', () => {
  it('should return false when route not found', () => {
    const router = createRouter();

    // Register a route
    router.get('/exists', (req, res) => {
      res.end('OK');
    });

    const req = createMockRequest('GET', '/not-exists');
    const res = createMockResponse();

    // handle() should return false for unmatched routes
    const result = router.handle(req, res);

    expect(result).toBe(false);
  });

  it('should return true when route is found', () => {
    const router = createRouter();

    router.get('/found', (req, res) => {
      res.end('Found');
    });

    const req = createMockRequest('GET', '/found');
    const res = createMockResponse();

    const result = router.handle(req, res);

    expect(result).toBe(true);
    expect(res._data).toBe('Found');
  });

  it('should get all registered routes', () => {
    const router = createRouter();

    router.get('/route1', () => {});
    router.post('/route2', () => {});
    router.put('/route3', () => {});

    const routes = router.getRoutes();

    expect(routes.length).toBe(3);
  });
});
