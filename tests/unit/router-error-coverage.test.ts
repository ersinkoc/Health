/**
 * @oxog/health - Router Error Handling Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createRouter } from '../../src/core/router.js';
import type { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';

// Mock IncomingMessage
function createMockRequest(method: string, url: string): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = {};
  return req;
}

// Mock ServerResponse
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

describe('Router Error Handling Coverage', () => {
  it('should handle sync route handler errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const router = createRouter();
    router.get('/error', () => {
      throw new Error('Sync error');
    });

    const req = createMockRequest('GET', '/error');
    const res = createMockResponse();

    router.handle(req, res);

    // Wait for error handling
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalled();
    expect(res._statusCode).toBe(500);
    expect(res._data).toBe('Internal Server Error');

    consoleSpy.mockRestore();
  });

  it('should handle async route handler errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const router = createRouter();
    router.get('/async-error', async () => {
      await Promise.resolve();
      throw new Error('Async error');
    });

    const req = createMockRequest('GET', '/async-error');
    const res = createMockResponse();

    router.handle(req, res);

    // Wait for async error handling
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(consoleSpy).toHaveBeenCalled();
    expect(res._statusCode).toBe(500);

    consoleSpy.mockRestore();
  });

  it('should not set status code if response already ended', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const router = createRouter();
    router.get('/already-ended', (req, res) => {
      res.end('Already done');
      throw new Error('Error after response');
    });

    const req = createMockRequest('GET', '/already-ended');
    const res = createMockResponse();

    router.handle(req, res);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalled();
    // Response was ended before error, so data should be 'Already done'
    expect(res._data).toBe('Already done');

    consoleSpy.mockRestore();
  });
});
