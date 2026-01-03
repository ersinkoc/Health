/**
 * @oxog/health - CLI Plugin Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { parseArgs, displayHelp, displayVersion } from '../../src/plugins/optional/cli.js';

describe('CLI Plugin Coverage', () => {
  describe('parseArgs', () => {
    it('should parse serve command', () => {
      const args = parseArgs(['serve']);
      expect(args.command).toBe('serve');
    });

    it('should parse check command', () => {
      const args = parseArgs(['check']);
      expect(args.command).toBe('check');
    });

    it('should parse port option', () => {
      const args = parseArgs(['serve', '-p', '3000']);
      expect(args.port).toBe(3000);
    });

    it('should parse --port option', () => {
      const args = parseArgs(['serve', '--port', '3000']);
      expect(args.port).toBe(3000);
    });

    it('should parse host option', () => {
      const args = parseArgs(['serve', '-h', 'localhost']);
      expect(args.host).toBe('localhost');
    });

    it('should parse --host option', () => {
      const args = parseArgs(['serve', '--host', 'localhost']);
      expect(args.host).toBe('localhost');
    });

    it('should parse interval option', () => {
      const args = parseArgs(['serve', '-i', '30s']);
      expect(args.interval).toBe('30s');
    });

    it('should parse --interval option', () => {
      const args = parseArgs(['serve', '--interval', '30s']);
      expect(args.interval).toBe('30s');
    });

    it('should parse timeout option', () => {
      const args = parseArgs(['serve', '-t', '5000']);
      expect(args.timeout).toBe(5000);
    });

    it('should parse --timeout option', () => {
      const args = parseArgs(['serve', '--timeout', '5000']);
      expect(args.timeout).toBe(5000);
    });

    it('should parse config option', () => {
      const args = parseArgs(['serve', '-c', './config.json']);
      expect(args.config).toBe('./config.json');
    });

    it('should parse --config option', () => {
      const args = parseArgs(['serve', '--config', './config.json']);
      expect(args.config).toBe('./config.json');
    });

    it('should parse format option', () => {
      const args = parseArgs(['serve', '-f', 'json']);
      expect(args.format).toBe('json');
    });

    it('should parse --format option', () => {
      const args = parseArgs(['serve', '--format', 'json']);
      expect(args.format).toBe('json');
    });

    it('should parse quiet option', () => {
      const args = parseArgs(['serve', '-q']);
      expect(args.quiet).toBe(true);
    });

    it('should parse --quiet option', () => {
      const args = parseArgs(['serve', '--quiet']);
      expect(args.quiet).toBe(true);
    });

    it('should parse --check-db option', () => {
      const args = parseArgs(['check', '--check-db']);
      expect(args.checkDb).toBe(true);
    });

    it('should parse --check-redis option', () => {
      const args = parseArgs(['check', '--check-redis']);
      expect(args.checkRedis).toBe(true);
    });

    it('should parse --help option', () => {
      const args = parseArgs(['serve', '--help']);
      expect(args.help).toBe(true);
    });

    it('should parse -? option', () => {
      const args = parseArgs(['serve', '-?']);
      expect(args.help).toBe(true);
    });

    it('should parse --version option', () => {
      const args = parseArgs(['serve', '--version']);
      expect(args.version).toBe(true);
    });

    it('should parse -V option', () => {
      const args = parseArgs(['serve', '-V']);
      expect(args.version).toBe(true);
    });

    it('should parse --url option', () => {
      const args = parseArgs(['check', '--url', 'http://localhost:9000/health']);
      expect(args.url).toBe('http://localhost:9000/health');
    });

    it('should parse positional URL argument for check command', () => {
      const args = parseArgs(['check', 'http://localhost:9000/health']);
      expect(args.url).toBe('http://localhost:9000/health');
    });

    it('should handle multiple options', () => {
      const args = parseArgs([
        'serve',
        '--port', '3000',
        '--host', 'localhost',
        '--interval', '15s',
        '--timeout', '3000',
        '--quiet'
      ]);
      expect(args.command).toBe('serve');
      expect(args.port).toBe(3000);
      expect(args.host).toBe('localhost');
      expect(args.interval).toBe('15s');
      expect(args.timeout).toBe(3000);
      expect(args.quiet).toBe(true);
    });

    it('should return defaults for empty args', () => {
      const args = parseArgs([]);
      expect(args.command).toBe('serve');
      expect(args.port).toBe(9000);
      expect(args.host).toBe('0.0.0.0');
      expect(args.format).toBe('table');
      expect(args.quiet).toBe(false);
    });
  });

  describe('displayHelp', () => {
    it('should not throw when displaying help', () => {
      expect(() => displayHelp()).not.toThrow();
    });

    it('should output help text', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      displayHelp();
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('@oxog/health');
      consoleSpy.mockRestore();
    });
  });

  describe('displayVersion', () => {
    it('should not throw when displaying version', () => {
      expect(() => displayVersion()).not.toThrow();
    });

    it('should output version string', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      displayVersion();
      expect(consoleSpy).toHaveBeenCalledWith('@oxog/health v1.0.0');
      consoleSpy.mockRestore();
    });
  });
});
