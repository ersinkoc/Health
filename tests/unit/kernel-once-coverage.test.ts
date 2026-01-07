/**
 * @oxog/health - Kernel once() Method Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';

describe('Kernel EventBus once() Coverage', () => {
  it('should trigger handler only once with once()', () => {
    const kernel = createHealthKernel({ port: 0 });
    const context = kernel.getContext();

    const handler = vi.fn();

    // Register once handler
    context.events.once('once:test', handler);

    // First emit should trigger handler
    kernel.emit('once:test', { data: 'first' });
    expect(handler).toHaveBeenCalledTimes(1);

    // Second emit should NOT trigger handler (already removed)
    kernel.emit('once:test', { data: 'second' });
    expect(handler).toHaveBeenCalledTimes(1);

    kernel.destroy();
  });

  it('should add handler to existing event set', () => {
    const kernel = createHealthKernel({ port: 0 });

    const handler1 = vi.fn();
    const handler2 = vi.fn();

    // First handler creates the event set
    kernel.on('multi:handler', handler1);
    // Second handler adds to existing set (tests the else branch in on())
    kernel.on('multi:handler', handler2);

    kernel.emit('multi:handler', { data: 'test' });

    expect(handler1).toHaveBeenCalledWith({ data: 'test' });
    expect(handler2).toHaveBeenCalledWith({ data: 'test' });

    kernel.destroy();
  });
});
