/**
 * @oxog/health - Router Middleware End Response Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createRouter } from '../../src/core/router.js';
import type { IncomingMessage, ServerResponse } from 'http';

describe('Router Middleware End Response', () => {
  it('should return true when middleware ends response', () => {
    const router = createRouter();

    // Add middleware that ends the response
    router.use((_req, res) => {
      res.writeHead(401);
      res.end('Unauthorized');
    });

    router.get('/protected', (_req, res) => {
      res.writeHead(200);
      res.end('ok');
    });

    const req = {
      method: 'GET',
      url: '/protected',
      headers: {},
    } as unknown as IncomingMessage;

    const res = {
      writeHead: vi.fn(),
      end: vi.fn(function(this: { writableEnded: boolean }) {
        this.writableEnded = true;
      }),
      setHeader: vi.fn(),
      writableEnded: false,
    } as unknown as ServerResponse;

    // Triggers lines 208-210 - middleware ends response
    const result = router.handle(req, res);

    expect(result).toBe(true);
    expect(res.writeHead).toHaveBeenCalledWith(401);
  });

  it('should continue to route when middleware does not end response', () => {
    const router = createRouter();

    // Add middleware that does NOT end the response
    router.use((_req, _res) => {
      // Just logging, doesn't end response
    });

    router.get('/open', (_req, res) => {
      res.writeHead(200);
      res.end('ok');
    });

    const req = {
      method: 'GET',
      url: '/open',
      headers: {},
    } as unknown as IncomingMessage;

    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      writableEnded: false,
    } as unknown as ServerResponse;

    const result = router.handle(req, res);

    expect(result).toBe(true);
    expect(res.writeHead).toHaveBeenCalledWith(200);
  });
});
