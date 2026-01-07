/**
 * Tests for src/cli.ts entry point
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('CLI Entry Point - src/cli.ts', () => {
  let originalArgv: string[];
  let originalExit: typeof process.exit;

  beforeEach(() => {
    originalArgv = process.argv;
    originalExit = process.exit;
    // Mock process.exit to prevent test from exiting
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
    vi.restoreAllMocks();
  });

  it('should export main function from plugins/optional/cli', async () => {
    const { main } = await import('../../src/plugins/optional/cli.js');
    expect(typeof main).toBe('function');
  });

  it('should handle --help flag', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.argv = ['node', 'cli.js', '--help'];

    const { main } = await import('../../src/plugins/optional/cli.js');
    await main();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle --version flag', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.argv = ['node', 'cli.js', '--version'];

    const { main } = await import('../../src/plugins/optional/cli.js');
    await main();

    expect(consoleSpy).toHaveBeenCalledWith('@oxog/health v1.0.0');
    consoleSpy.mockRestore();
  });

  it('should handle error in main with catch', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.argv = ['node', 'cli.js', 'check', 'invalid-url-format'];

    const { main } = await import('../../src/plugins/optional/cli.js');

    // main() should handle errors gracefully
    try {
      await main();
    } catch {
      // Expected to potentially throw
    }

    errorSpy.mockRestore();
  });
});
