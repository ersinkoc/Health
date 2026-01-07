/**
 * @oxog/health - HTTP Utils Edge Cases Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { getJsonBody, respond } from '../../src/utils/http.js';
import type { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';

describe('HTTP Utils Edge Cases', () => {
  it('should return undefined for empty body in getJsonBody', async () => {
    const req = new EventEmitter() as IncomingMessage;

    const promise = getJsonBody(req);

    // Simulate empty body - triggers line 112
    req.emit('end');

    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('should return undefined for invalid JSON in getJsonBody', async () => {
    const req = new EventEmitter() as IncomingMessage;

    const promise = getJsonBody(req);

    // Simulate invalid JSON - triggers lines 116-117
    req.emit('data', Buffer.from('not valid json'));
    req.emit('end');

    const result = await promise;
    expect(result).toBeUndefined();
  });

  it('should respond with text when text content is provided', () => {
    const req = {
      headers: { accept: 'text/plain' },
    } as unknown as IncomingMessage;

    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as ServerResponse;

    // Triggers lines 369-372 - text content fallback
    respond(res, req, {
      text: 'Plain text content',
    });

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
  });

  it('should respond with json as fallback when no preferred match', () => {
    const req = {
      headers: { accept: 'text/html' }, // wants HTML
    } as unknown as IncomingMessage;

    const res = {
      writeHead: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as ServerResponse;

    // Triggers lines 374-377 - json fallback when no html provided
    respond(res, req, {
      json: { message: 'test' },
    });

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
  });

  it('should return 404 when no content is provided', () => {
    const req = {
      headers: { accept: 'text/html' },
    } as unknown as IncomingMessage;

    const res = {
      statusCode: 0,
      end: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as ServerResponse;

    // Triggers line 379 - no matching content
    respond(res, req, {});

    expect(res.statusCode).toBe(404);
  });
});
