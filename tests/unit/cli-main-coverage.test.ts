/**
 * @oxog/health - CLI Main Coverage Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  main,
  parseArgs,
  serveCommand,
  checkCommand,
  displayHelp,
  displayVersion,
} from '../../src/plugins/optional/cli.js';

describe('CLI Main Function Coverage', () => {
  let originalArgv: string[];
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: number | undefined;

  beforeEach(() => {
    originalArgv = process.argv;
    originalExitCode = process.exitCode;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should display help when --help is passed', async () => {
    process.argv = ['node', 'cli', '--help'];

    await main();

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0]?.[0];
    expect(output).toContain('@oxog/health');
    expect(output).toContain('COMMANDS');
  });

  it('should display version when --version is passed', async () => {
    process.argv = ['node', 'cli', '--version'];

    await main();

    expect(consoleLogSpy).toHaveBeenCalledWith('@oxog/health v1.0.0');
  });

  it('should display version when -V is passed', async () => {
    process.argv = ['node', 'cli', '-V'];

    await main();

    expect(consoleLogSpy).toHaveBeenCalledWith('@oxog/health v1.0.0');
  });

  it('should display help when check command has no URL', async () => {
    process.argv = ['node', 'cli', 'check'];

    await main();

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0]?.[0];
    expect(output).toContain('COMMANDS');
  });
});

describe('CLI checkCommand Output Formats', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: number | undefined;

  beforeEach(() => {
    originalExitCode = process.exitCode;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should handle check command with minimal format', async () => {
    // This will fail since no server is running, but tests the error path
    await checkCommand('http://localhost:99999/health', 'minimal');

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(3);
  });

  it('should handle check command with table format', async () => {
    await checkCommand('http://localhost:99999/health', 'table');

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(3);
  });

  it('should handle check command with json format', async () => {
    await checkCommand('http://localhost:99999/health', 'json');

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(process.exitCode).toBe(3);
  });
});

describe('CLI displayHelp and displayVersion', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should display comprehensive help text', () => {
    displayHelp();

    const output = consoleLogSpy.mock.calls[0]?.[0];
    expect(output).toContain('@oxog/health');
    expect(output).toContain('USAGE');
    expect(output).toContain('COMMANDS');
    expect(output).toContain('serve');
    expect(output).toContain('check');
    expect(output).toContain('OPTIONS');
    expect(output).toContain('--port');
    expect(output).toContain('--host');
    expect(output).toContain('--help');
    expect(output).toContain('--version');
    expect(output).toContain('EXAMPLES');
    expect(output).toContain('EXIT CODES');
  });

  it('should display version string', () => {
    displayVersion();

    expect(consoleLogSpy).toHaveBeenCalledWith('@oxog/health v1.0.0');
  });
});

describe('CLI parseArgs edge cases', () => {
  it('should handle empty args array', () => {
    const args = parseArgs([]);

    expect(args.command).toBe('serve');
    expect(args.port).toBe(9000);
    expect(args.host).toBe('0.0.0.0');
  });

  it('should handle args with missing values', () => {
    const args = parseArgs(['--port']);

    // Port should remain default since no value was provided
    expect(args.port).toBe(9000);
  });

  it('should handle multiple flags', () => {
    const args = parseArgs([
      'serve',
      '--quiet',
      '--check-db',
      '--check-redis',
      '-p', '8080',
    ]);

    expect(args.command).toBe('serve');
    expect(args.quiet).toBe(true);
    expect(args.checkDb).toBe(true);
    expect(args.checkRedis).toBe(true);
    expect(args.port).toBe(8080);
  });
});
