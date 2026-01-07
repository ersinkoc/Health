/**
 * @oxog/health - CLI Coverage Tests
 *
 * Tests for CLI entry point and CLI plugin functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseArgs,
  displayHelp,
  displayVersion,
  checkCommand,
  cliPlugin,
  cliPluginWithOptions,
} from '../../src/plugins/optional/cli.js';
import {
  formatPrometheusMetrics,
  formatJsonMetrics,
} from '../../src/plugins/optional/metrics.js';
import { isValidThreshold } from '../../src/plugins/optional/thresholds.js';

describe('CLI parseArgs', () => {
  it('should parse serve command', () => {
    const args = parseArgs(['serve']);
    expect(args.command).toBe('serve');
  });

  it('should parse check command', () => {
    const args = parseArgs(['check']);
    expect(args.command).toBe('check');
  });

  it('should parse port with -p', () => {
    const args = parseArgs(['-p', '8080']);
    expect(args.port).toBe(8080);
  });

  it('should parse port with --port', () => {
    const args = parseArgs(['--port', '3000']);
    expect(args.port).toBe(3000);
  });

  it('should parse host with -h', () => {
    const args = parseArgs(['-h', '127.0.0.1']);
    expect(args.host).toBe('127.0.0.1');
  });

  it('should parse host with --host', () => {
    const args = parseArgs(['--host', 'localhost']);
    expect(args.host).toBe('localhost');
  });

  it('should parse interval with -i', () => {
    const args = parseArgs(['-i', '60s']);
    expect(args.interval).toBe('60s');
  });

  it('should parse interval with --interval', () => {
    const args = parseArgs(['--interval', '5m']);
    expect(args.interval).toBe('5m');
  });

  it('should parse timeout with -t', () => {
    const args = parseArgs(['-t', '10000']);
    expect(args.timeout).toBe(10000);
  });

  it('should parse timeout with --timeout', () => {
    const args = parseArgs(['--timeout', '5000']);
    expect(args.timeout).toBe(5000);
  });

  it('should parse config with -c', () => {
    const args = parseArgs(['-c', 'health.config.js']);
    expect(args.config).toBe('health.config.js');
  });

  it('should parse config with --config', () => {
    const args = parseArgs(['--config', './config.json']);
    expect(args.config).toBe('./config.json');
  });

  it('should parse format with -f', () => {
    const args = parseArgs(['-f', 'json']);
    expect(args.format).toBe('json');
  });

  it('should parse format with --format', () => {
    const args = parseArgs(['--format', 'minimal']);
    expect(args.format).toBe('minimal');
  });

  it('should parse quiet with -q', () => {
    const args = parseArgs(['-q']);
    expect(args.quiet).toBe(true);
  });

  it('should parse quiet with --quiet', () => {
    const args = parseArgs(['--quiet']);
    expect(args.quiet).toBe(true);
  });

  it('should parse --check-db', () => {
    const args = parseArgs(['--check-db']);
    expect(args.checkDb).toBe(true);
  });

  it('should parse --check-redis', () => {
    const args = parseArgs(['--check-redis']);
    expect(args.checkRedis).toBe(true);
  });

  it('should parse --help', () => {
    const args = parseArgs(['--help']);
    expect(args.help).toBe(true);
  });

  it('should parse -?', () => {
    const args = parseArgs(['-?']);
    expect(args.help).toBe(true);
  });

  it('should parse --version', () => {
    const args = parseArgs(['--version']);
    expect(args.version).toBe(true);
  });

  it('should parse -V', () => {
    const args = parseArgs(['-V']);
    expect(args.version).toBe(true);
  });

  it('should parse --url', () => {
    const args = parseArgs(['--url', 'http://localhost:9000/health']);
    expect(args.url).toBe('http://localhost:9000/health');
  });

  it('should parse URL as positional for check command', () => {
    const args = parseArgs(['check', 'http://localhost:9000/health']);
    expect(args.command).toBe('check');
    expect(args.url).toBe('http://localhost:9000/health');
  });

  it('should have default values', () => {
    const args = parseArgs([]);
    expect(args.command).toBe('serve');
    expect(args.port).toBe(9000);
    expect(args.host).toBe('0.0.0.0');
    expect(args.format).toBe('table');
    expect(args.quiet).toBe(false);
  });

  it('should parse complex command line', () => {
    const args = parseArgs([
      'serve',
      '-p', '8080',
      '-h', '127.0.0.1',
      '-i', '30s',
      '-t', '5000',
      '--check-db',
      '--check-redis',
    ]);

    expect(args.command).toBe('serve');
    expect(args.port).toBe(8080);
    expect(args.host).toBe('127.0.0.1');
    expect(args.interval).toBe('30s');
    expect(args.timeout).toBe(5000);
    expect(args.checkDb).toBe(true);
    expect(args.checkRedis).toBe(true);
  });
});

describe('CLI displayHelp', () => {
  it('should display help text', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    displayHelp();
    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.mock.calls[0]?.[0]).toContain('@oxog/health');
    expect(logSpy.mock.calls[0]?.[0]).toContain('COMMANDS');
    expect(logSpy.mock.calls[0]?.[0]).toContain('OPTIONS');
    logSpy.mockRestore();
  });
});

describe('CLI displayVersion', () => {
  it('should display version', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    displayVersion();
    expect(logSpy).toHaveBeenCalledWith('@oxog/health v1.0.0');
    logSpy.mockRestore();
  });
});

describe('CLI checkCommand', () => {
  let originalExitCode: number | undefined;

  beforeEach(() => {
    originalExitCode = process.exitCode;
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
  });

  it('should handle network errors gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await checkCommand('http://localhost:99999/health', 'json');

    expect(errorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(3);
    errorSpy.mockRestore();
  });

  it('should handle invalid URL errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await checkCommand('not-a-valid-url', 'table');

    expect(errorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(3);
    errorSpy.mockRestore();
  });
});

describe('CLI Plugin', () => {
  it('should have correct plugin properties', () => {
    expect(cliPlugin.name).toBe('cli');
    expect(cliPlugin.version).toBe('1.0.0');
    expect(cliPlugin.dependencies).toEqual([]);
  });

  it('should create plugin with options', () => {
    const plugin = cliPluginWithOptions();
    expect(plugin.name).toBe('cli');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.install).toBeDefined();
  });
});

describe('Metrics formatPrometheusMetrics', () => {
  it('should format healthy status', () => {
    const status = {
      status: 'healthy' as const,
      score: 100,
      uptime: 3600,
      timestamp: '2024-01-01T00:00:00.000Z',
      checks: {
        database: { status: 'healthy' as const, latency: 5, lastCheck: '2024-01-01T00:00:00.000Z' },
      },
    };

    const output = formatPrometheusMetrics(status);

    expect(output).toContain('# HELP health_check_status');
    expect(output).toContain('# TYPE health_check_status gauge');
    expect(output).toContain('health_check_status{name="database"} 1');
    expect(output).toContain('health_check_latency_ms{name="database"} 5');
    expect(output).toContain('health_score 100');
    expect(output).toContain('health_uptime_seconds 3600');
  });

  it('should format degraded status', () => {
    const status = {
      status: 'degraded' as const,
      score: 70,
      uptime: 1000,
      timestamp: '2024-01-01T00:00:00.000Z',
      checks: {
        cache: { status: 'degraded' as const, latency: 50, lastCheck: '2024-01-01T00:00:00.000Z' },
      },
    };

    const output = formatPrometheusMetrics(status);

    expect(output).toContain('health_check_status{name="cache"} 0.5');
  });

  it('should format unhealthy status', () => {
    const status = {
      status: 'unhealthy' as const,
      score: 0,
      uptime: 500,
      timestamp: '2024-01-01T00:00:00.000Z',
      checks: {
        api: { status: 'unhealthy' as const, latency: 0, lastCheck: '2024-01-01T00:00:00.000Z', error: 'Connection failed' },
      },
    };

    const output = formatPrometheusMetrics(status);

    expect(output).toContain('health_check_status{name="api"} 0');
    expect(output).toContain('health_check_latency_ms{name="api"} 0');
  });

  it('should handle missing latency', () => {
    const status = {
      status: 'healthy' as const,
      score: 100,
      uptime: 100,
      timestamp: '2024-01-01T00:00:00.000Z',
      checks: {
        test: { status: 'healthy' as const, lastCheck: '2024-01-01T00:00:00.000Z' },
      },
    };

    const output = formatPrometheusMetrics(status);

    expect(output).toContain('health_check_latency_ms{name="test"} 0');
  });
});

describe('Metrics formatJsonMetrics', () => {
  it('should format as JSON object', () => {
    const status = {
      status: 'healthy' as const,
      score: 100,
      uptime: 3600,
      timestamp: '2024-01-01T00:00:00.000Z',
      checks: {
        database: { status: 'healthy' as const, latency: 5, lastCheck: '2024-01-01T00:00:00.000Z' },
      },
    };

    const output = formatJsonMetrics(status) as {
      uptime: number;
      score: number;
      status: string;
      checks: Record<string, unknown>;
    };

    expect(output.uptime).toBe(3600);
    expect(output.score).toBe(100);
    expect(output.status).toBe('healthy');
    expect(output.checks.database).toBeDefined();
  });

  it('should include error in check result', () => {
    const status = {
      status: 'unhealthy' as const,
      score: 0,
      uptime: 100,
      timestamp: '2024-01-01T00:00:00.000Z',
      checks: {
        api: { status: 'unhealthy' as const, latency: 0, lastCheck: '2024-01-01T00:00:00.000Z', error: 'Connection failed' },
      },
    };

    const output = formatJsonMetrics(status) as {
      checks: Record<string, { error?: string }>;
    };

    expect(output.checks.api?.error).toBe('Connection failed');
  });
});

describe('Thresholds isValidThreshold', () => {
  it('should return true for valid thresholds', () => {
    expect(isValidThreshold(0)).toBe(true);
    expect(isValidThreshold(50)).toBe(true);
    expect(isValidThreshold(100)).toBe(true);
    expect(isValidThreshold(80.5)).toBe(true);
  });

  it('should return false for values below 0', () => {
    expect(isValidThreshold(-1)).toBe(false);
    expect(isValidThreshold(-100)).toBe(false);
  });

  it('should return false for values above 100', () => {
    expect(isValidThreshold(101)).toBe(false);
    expect(isValidThreshold(150)).toBe(false);
  });

  it('should return false for non-numbers', () => {
    expect(isValidThreshold('80')).toBe(false);
    expect(isValidThreshold(null)).toBe(false);
    expect(isValidThreshold(undefined)).toBe(false);
    expect(isValidThreshold({})).toBe(false);
    expect(isValidThreshold([])).toBe(false);
  });

  it('should return false for NaN', () => {
    expect(isValidThreshold(NaN)).toBe(false);
  });
});
