/**
 * @oxog/health - Kernel Logger Debug Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';

describe('Kernel Logger Debug', () => {
  it('should call debug logger method', () => {
    const kernel = createHealthKernel({ port: 0 });
    const context = kernel.getContext();

    // Spy on console.debug
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    context.logger.debug('Test debug message');

    expect(debugSpy).toHaveBeenCalledWith('[DEBUG] Test debug message');

    debugSpy.mockRestore();
    kernel.destroy();
  });

  it('should call debug logger with data', () => {
    const kernel = createHealthKernel({ port: 0 });
    const context = kernel.getContext();

    // Spy on console.debug
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    context.logger.debug('Test debug with data', { key: 'value' });

    expect(debugSpy).toHaveBeenCalled();

    debugSpy.mockRestore();
    kernel.destroy();
  });
});
