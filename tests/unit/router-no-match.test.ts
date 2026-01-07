/**
 * @oxog/health - Router No Match Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createRouter } from '../../src/core/router.js';
import type { IncomingMessage, ServerResponse } from 'http';

describe('Router No Match Returns False', () => {
  it('should return false when no route matches', () => {
    const router = createRouter();

    // Register a specific route
    router.get('/health', (_req, res) => {
      res.writeHead(200);
      res.end('ok');
    });

    // Create mock request for non-matching path
    const req = {
      method: 'GET',
      url: '/nonexistent',
      headers: {},
    } as unknown as IncomingMessage;

    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as ServerResponse;

    // handle() should return false for no match
    const result = router.handle(req, res);
    expect(result).toBe(false);
  });

  it('should return false for wrong method on existing path', () => {
    const router = createRouter();

    // Register GET route
    router.get('/api', (_req, res) => {
      res.writeHead(200);
      res.end('ok');
    });

    // Try POST on same path
    const req = {
      method: 'POST',
      url: '/api',
      headers: {},
    } as unknown as IncomingMessage;

    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as ServerResponse;

    const result = router.handle(req, res);
    expect(result).toBe(false);
  });

  it('should return true when route matches', () => {
    const router = createRouter();

    router.get('/status', (_req, res) => {
      res.writeHead(200);
      res.end('ok');
    });

    const req = {
      method: 'GET',
      url: '/status',
      headers: {},
    } as unknown as IncomingMessage;

    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as ServerResponse;

    const result = router.handle(req, res);
    expect(result).toBe(true);
  });
});
