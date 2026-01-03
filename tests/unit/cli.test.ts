import { describe, it, expect, vi } from 'vitest';
import {
  parseArgs,
  serveCommand,
  checkCommand,
  displayHelp,
  displayVersion,
  cliPlugin,
  cliPluginWithOptions,
  main,
} from '../../src/plugins/optional/cli.js';
import { sleep } from '../../src/utils/promise.js';

describe('cli.ts - Argument Parsing', () => {
  describe('parseArgs', () => {
    it('should parse serve command', () => {
      const args = parseArgs(['serve', '--port', '3000']);
      expect(args.command).toBe('serve');
      expect(args.port).toBe(3000);
    });

    it('should parse check command', () => {
      const args = parseArgs(['check', 'http://localhost:9000/health']);
      expect(args.command).toBe('check');
      expect(args.url).toBe('http://localhost:9000/health');
    });

    it('should parse host option', () => {
      const args = parseArgs(['serve', '--host', '127.0.0.1']);
      expect(args.host).toBe('127.0.0.1');
    });

    it('should parse interval option', () => {
      const args = parseArgs(['serve', '--interval', '60s']);
      expect(args.interval).toBe('60s');
    });

    it('should parse timeout option', () => {
      const args = parseArgs(['serve', '--timeout', '10000']);
      expect(args.timeout).toBe(10000);
    });

    it('should parse format option', () => {
      const args = parseArgs(['check', 'http://localhost', '--format', 'json']);
      expect(args.format).toBe('json');
    });

    it('should set quiet mode', () => {
      const args = parseArgs(['serve', '--quiet']);
      expect(args.quiet).toBe(true);
    });

    it('should set help flag', () => {
      const args = parseArgs(['--help']);
      expect(args.help).toBe(true);
    });

    it('should set version flag', () => {
      const args = parseArgs(['--version']);
      expect(args.version).toBe(true);
    });

    it('should set check-db flag', () => {
      const args = parseArgs(['serve', '--check-db']);
      expect(args.checkDb).toBe(true);
    });

    it('should set check-redis flag', () => {
      const args = parseArgs(['serve', '--check-redis']);
      expect(args.checkRedis).toBe(true);
    });

    it('should use default values', () => {
      const args = parseArgs([]);
      expect(args.command).toBe('serve');
      expect(args.port).toBe(9000);
      expect(args.host).toBe('0.0.0.0');
      expect(args.format).toBe('table');
      expect(args.quiet).toBe(false);
    });

    it('should parse --url option for check command', () => {
      const args = parseArgs(['check', '--url', 'http://localhost:9000/health']);
      expect(args.url).toBe('http://localhost:9000/health');
    });

    it('should handle -p shorthand for port', () => {
      const args = parseArgs(['serve', '-p', '8080']);
      expect(args.port).toBe(8080);
    });

    it('should handle -h shorthand for host', () => {
      const args = parseArgs(['serve', '-h', 'localhost']);
      expect(args.host).toBe('localhost');
    });

    it('should handle -? as help', () => {
      const args = parseArgs(['-?']);
      expect(args.help).toBe(true);
    });

    it('should handle -V as version', () => {
      const args = parseArgs(['-V']);
      expect(args.version).toBe(true);
    });

    it('should parse config option', () => {
      const args = parseArgs(['serve', '--config', './config.json']);
      expect(args.config).toBe('./config.json');
    });

    it('should parse -c shorthand for config', () => {
      const args = parseArgs(['serve', '-c', './config.json']);
      expect(args.config).toBe('./config.json');
    });
  });
});

describe('cli.ts - CLI Commands', () => {
  describe('displayHelp', () => {
    it('should display help message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      displayHelp();
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('@oxog/health'));
      consoleSpy.mockRestore();
    });
  });

  describe('displayVersion', () => {
    it('should display version', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      displayVersion();
      expect(consoleSpy).toHaveBeenCalledWith('@oxog/health v1.0.0');
      consoleSpy.mockRestore();
    });
  });
});

describe('cli.ts - Plugin', () => {
  describe('cliPlugin', () => {
    it('should have correct name and version', () => {
      expect(cliPlugin.name).toBe('cli');
      expect(cliPlugin.version).toBe('1.0.0');
    });

    it('should have no dependencies', () => {
      expect(cliPlugin.dependencies).toEqual([]);
    });

    it('should have install method', () => {
      expect(typeof cliPlugin.install).toBe('function');
    });
  });

  describe('cliPluginWithOptions', () => {
    it('should create a plugin with options', () => {
      const plugin = cliPluginWithOptions();
      expect(plugin.name).toBe('cli');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.install).toBeDefined();
    });
  });

  describe('main', () => {
    it('should be an async function', async () => {
      expect(typeof main).toBe('function');
      expect(main.constructor.name).toBe('AsyncFunction');
    });
  });
});

describe('cli.ts - serveCommand', () => {
  it('should accept serve options', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.on to prevent hanging
    const originalOn = process.on;
    process.on = vi.fn();
    const originalOff = process.off;
    process.off = vi.fn();

    // Start server but don't wait indefinitely
    const servePromise = serveCommand({
      port: 0, // Random available port
      host: '127.0.0.1',
    });

    // Give it a moment to start
    await sleep(100);

    // Close the server
    const kernel = (serveCommand as any).__kernel__;
    if (kernel) {
      await kernel.destroy();
    }

    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    process.on = originalOn;
    process.off = originalOff;
  });
});

describe('cli.ts - checkCommand', () => {
  it('should exist and be async', async () => {
    expect(typeof checkCommand).toBe('function');
    expect(checkCommand.constructor.name).toBe('AsyncFunction');
  });
});
