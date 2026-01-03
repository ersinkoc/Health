/**
 * @oxog/health - Router Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Router, createRouter } from '../../src/core/router.js';
import type { IncomingMessage, ServerResponse } from 'http';

describe('Router', () => {
  let router: Router;
  let mockReq: IncomingMessage;
  let mockRes: ServerResponse;

  beforeEach(() => {
    router = createRouter({ basePath: '/' });
    mockReq = {
      method: 'GET',
      url: '/',
      headers: {},
    } as unknown as IncomingMessage;

    mockRes = {
      statusCode: 200,
      writableEnded: false,
      setHeader: vi.fn(),
      end: vi.fn(),
      writeHead: vi.fn(),
    } as unknown as ServerResponse;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should register a GET route', () => {
      const handler = vi.fn();
      router.get('/health', handler);
      expect(router.getRoutesForMethod('GET')).toHaveLength(1);
    });
  });

  describe('post', () => {
    it('should register a POST route', () => {
      const handler = vi.fn();
      router.post('/health', handler);
      expect(router.getRoutesForMethod('POST')).toHaveLength(1);
    });
  });

  describe('match', () => {
    it('should match exact path', () => {
      const handler = vi.fn();
      router.get('/health', handler);

      const match = router.match('GET', '/health');
      expect(match).not.toBeNull();
      expect(match?.params).toEqual({});
    });

    it('should match path with parameters', () => {
      const handler = vi.fn();
      router.get('/users/:id', handler);

      const match = router.match('GET', '/users/123');
      expect(match).not.toBeNull();
      expect(match?.params.id).toBe('123');
    });

    it('should match path with multiple parameters', () => {
      const handler = vi.fn();
      router.get('/users/:userId/posts/:postId', handler);

      const match = router.match('GET', '/users/123/posts/456');
      expect(match).not.toBeNull();
      expect(match?.params.userId).toBe('123');
      expect(match?.params.postId).toBe('456');
    });

    it('should return null for unmatched path', () => {
      router.get('/health', vi.fn());
      const match = router.match('GET', '/other');
      expect(match).toBeNull();
    });

    it('should return null for unmatched method', () => {
      router.get('/health', vi.fn());
      const match = router.match('POST', '/health');
      expect(match).toBeNull();
    });
  });

  describe('handle', () => {
    it('should call handler for matching route', () => {
      const handler = vi.fn();
      router.get('/health', handler);

      mockReq.url = '/health';
      const handled = router.handle(mockReq, mockRes);

      expect(handled).toBe(true);
      expect(handler).toHaveBeenCalled();
    });

    it('should return false for unmatched route', () => {
      const handler = vi.fn();
      router.get('/health', handler);

      mockReq.url = '/other';
      const handled = router.handle(mockReq, mockRes);

      expect(handled).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should add params to request', () => {
      router.get('/users/:id', vi.fn());
      mockReq.url = '/users/123';

      router.handle(mockReq, mockRes);

      expect((mockReq as unknown as { params: Record<string, string> }).params.id).toBe('123');
    });
  });

  describe('clear', () => {
    it('should remove all routes', () => {
      router.get('/health', vi.fn());
      router.get('/ready', vi.fn());

      router.clear();

      expect(router.getRoutes()).toHaveLength(0);
    });
  });

  describe('removeRoute', () => {
    it('should remove a specific route', () => {
      router.get('/health', vi.fn());
      router.get('/ready', vi.fn());

      const removed = router.removeRoute('GET', '/health');

      expect(removed).toBe(true);
      expect(router.getRoutes()).toHaveLength(1);
    });

    it('should return false for non-existent route', () => {
      router.get('/health', vi.fn());

      const removed = router.removeRoute('GET', '/other');

      expect(removed).toBe(false);
    });
  });

  describe('use', () => {
    it('should add middleware', () => {
      const middleware = vi.fn();
      router.use(middleware);
      router.get('/health', vi.fn());

      mockReq.url = '/health';
      router.handle(mockReq, mockRes);

      expect(middleware).toHaveBeenCalled();
    });
  });
});
