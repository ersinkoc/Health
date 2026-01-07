/**
 * @oxog/health - Kernel Logger Error with Data Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';

describe('Kernel Logger Error with Data', () => {
  it('should call error logger with data parameter', () => {
    const kernel = createHealthKernel({ port: 0 });
    const context = kernel.getContext();

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Call with data parameter - covers line 43 branch
    context.logger.error('Test error message', { errorCode: 500, details: 'test' });

    expect(errorSpy).toHaveBeenCalledWith(
      '[ERROR] Test error message',
      { errorCode: 500, details: 'test' }
    );

    errorSpy.mockRestore();
    kernel.destroy();
  });

  it('should call error logger without data (default empty string)', () => {
    const kernel = createHealthKernel({ port: 0 });
    const context = kernel.getContext();

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Call without data - uses default ''
    context.logger.error('Error without data');

    expect(errorSpy).toHaveBeenCalledWith('[ERROR] Error without data', '');

    errorSpy.mockRestore();
    kernel.destroy();
  });
});
