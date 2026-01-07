/**
 * @oxog/health - CLI Entry Point Tests
 *
 * Tests for the CLI entry point (src/cli.ts)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to mock the cli module before importing
vi.mock('../../src/plugins/optional/cli.js', () => ({
  main: vi.fn(),
}));

describe('CLI Entry Point', () => {
  let originalExit: typeof process.exit;
  let mockExit: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    originalExit = process.exit;
    mockExit = vi.fn();
    process.exit = mockExit as unknown as typeof process.exit;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exit = originalExit;
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should call main function from cli plugin', async () => {
    const { main } = await import('../../src/plugins/optional/cli.js');
    (main as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    // Import cli.ts to trigger main()
    await import('../../src/cli.js');

    expect(main).toHaveBeenCalled();
  });

  it('should handle errors and exit with code 1', async () => {
    const { main } = await import('../../src/plugins/optional/cli.js');
    const testError = new Error('Test error');
    (main as ReturnType<typeof vi.fn>).mockRejectedValue(testError);

    // Import cli.ts to trigger main()
    await import('../../src/cli.js');

    // Wait for promise rejection to be handled
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', testError);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
