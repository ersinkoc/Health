/**
 * @oxog/health - Kernel Event Bus Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';

describe('Kernel EventBus Coverage', () => {
  it('should add handler to existing event handlers set', () => {
    const kernel = createHealthKernel({ port: 0 });

    const handler1 = vi.fn();
    const handler2 = vi.fn();

    // First handler creates the Set
    kernel.on('test:event', handler1);
    // Second handler adds to existing Set
    kernel.on('test:event', handler2);

    kernel.emit('test:event', { data: 'test' });

    expect(handler1).toHaveBeenCalledWith({ data: 'test' });
    expect(handler2).toHaveBeenCalledWith({ data: 'test' });

    kernel.destroy();
  });

  it('should not throw when emitting event with no handlers', () => {
    const kernel = createHealthKernel({ port: 0 });

    // This should not throw - just do nothing
    expect(() => kernel.emit('nonexistent:event', { data: 'test' })).not.toThrow();

    kernel.destroy();
  });

  it('should handle once() correctly', () => {
    const kernel = createHealthKernel({ port: 0 });

    const handler = vi.fn();
    const context = kernel.getContext();

    // Use once to register handler
    context.events.once('once:event', handler);

    // First emit should call handler
    kernel.emit('once:event', { data: 'first' });
    expect(handler).toHaveBeenCalledTimes(1);

    // Second emit should not call handler
    kernel.emit('once:event', { data: 'second' });
    expect(handler).toHaveBeenCalledTimes(1);

    kernel.destroy();
  });
});
