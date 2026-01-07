/**
 * @oxog/health - CLI Plugin Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';
import { cliPluginWithOptions } from '../../src/plugins/optional/cli.js';

describe('CLI Plugin Coverage', () => {
  it('should install cliPluginWithOptions', async () => {
    const kernel = createHealthKernel({ port: 0 });

    const eventEmitSpy = vi.spyOn(kernel, 'emit');

    kernel.use(cliPluginWithOptions());

    expect(eventEmitSpy).toHaveBeenCalledWith('cli:installed', expect.anything());

    await kernel.destroy();
    eventEmitSpy.mockRestore();
  });

  it('should have correct plugin properties from cliPluginWithOptions', () => {
    const plugin = cliPluginWithOptions();

    expect(plugin.name).toBe('cli');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.dependencies).toEqual([]);
    expect(plugin.install).toBeInstanceOf(Function);
  });
});
