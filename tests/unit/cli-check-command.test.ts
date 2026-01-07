/**
 * @oxog/health - CLI Check Command Coverage Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'http';
import { checkCommand } from '../../src/plugins/optional/cli.js';

describe('CLI Check Command Output Formats', () => {
  let server: http.Server;
  let port: number;
  let mockConsoleLog: ReturnType<typeof vi.fn>;
  let mockConsoleError: ReturnType<typeof vi.fn>;
  let originalLog: typeof console.log;
  let originalError: typeof console.error;

  beforeEach(async () => {
    originalLog = console.log;
    originalError = console.error;
    mockConsoleLog = vi.fn();
    mockConsoleError = vi.fn();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    process.exitCode = undefined;
  });

  afterEach(async () => {
    console.log = originalLog;
    console.error = originalError;
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it('should output JSON format for healthy status', async () => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'healthy',
        score: 100,
        uptime: 3600,
        checks: { db: { status: 'healthy' } },
      }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as { port: number }).port;
        resolve();
      });
    });

    await checkCommand(`http://localhost:${port}`, 'json');

    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls[0][0];
    expect(output).toContain('"status"');
    expect(output).toContain('"healthy"');
    expect(process.exitCode).toBe(0);
  });

  it('should output table format for healthy status', async () => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'healthy',
        score: 100,
        uptime: 3600,
        checks: { db: { status: 'healthy' } },
      }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as { port: number }).port;
        resolve();
      });
    });

    await checkCommand(`http://localhost:${port}`, 'table');

    expect(mockConsoleLog).toHaveBeenCalled();
    const calls = mockConsoleLog.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c?.includes('Status:'))).toBe(true);
    expect(calls.some((c) => c?.includes('Score:'))).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  it('should output minimal format for healthy status', async () => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'healthy',
        score: 100,
        uptime: 3600,
        checks: {},
      }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as { port: number }).port;
        resolve();
      });
    });

    await checkCommand(`http://localhost:${port}`, 'minimal');

    expect(mockConsoleLog).toHaveBeenCalledWith('healthy');
    expect(process.exitCode).toBe(0);
  });

  it('should set exit code 1 for degraded status', async () => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'degraded', score: 75, uptime: 3600, checks: {} }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as { port: number }).port;
        resolve();
      });
    });

    await checkCommand(`http://localhost:${port}`, 'minimal');

    expect(mockConsoleLog).toHaveBeenCalledWith('degraded');
    expect(process.exitCode).toBe(1);
  });

  it('should set exit code 2 for unhealthy status', async () => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'unhealthy', score: 0, uptime: 3600, checks: {} }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as { port: number }).port;
        resolve();
      });
    });

    await checkCommand(`http://localhost:${port}`, 'minimal');

    expect(mockConsoleLog).toHaveBeenCalledWith('unhealthy');
    expect(process.exitCode).toBe(2);
  });

  it('should set exit code 3 on error', async () => {
    await checkCommand('http://localhost:99999', 'json');

    expect(mockConsoleError).toHaveBeenCalled();
    expect(process.exitCode).toBe(3);
  });

  it('should show check icons in table format', async () => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        status: 'degraded',
        score: 66,
        uptime: 7200,
        checks: {
          database: { status: 'healthy' },
          cache: { status: 'degraded' },
          api: { status: 'unhealthy', error: 'Connection refused' },
        },
      }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as { port: number }).port;
        resolve();
      });
    });

    await checkCommand(`http://localhost:${port}`, 'table');

    const calls = mockConsoleLog.mock.calls.map((c) => c[0]);
    // Check for status icons
    expect(calls.some((c) => c?.includes('✓'))).toBe(true);
    expect(calls.some((c) => c?.includes('!'))).toBe(true);
    expect(calls.some((c) => c?.includes('✗'))).toBe(true);
    expect(calls.some((c) => c?.includes('Connection refused'))).toBe(true);
  });
});
