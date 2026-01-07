/**
 * @oxog/health - Kernel Event Handlers Coverage Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { createHealthKernel } from '../../src/kernel.js';

describe('Kernel EventBus Multiple Handlers', () => {
  it('should add multiple handlers to same event', () => {
    const kernel = createHealthKernel({ port: 0 });

    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    // Add first handler (creates the Set)
    kernel.on('test:multi', handler1);
    // Add second handler (adds to existing Set - covers line 63-64)
    kernel.on('test:multi', handler2);
    // Add third handler
    kernel.on('test:multi', handler3);

    kernel.emit('test:multi', { value: 42 });

    expect(handler1).toHaveBeenCalledWith({ value: 42 });
    expect(handler2).toHaveBeenCalledWith({ value: 42 });
    expect(handler3).toHaveBeenCalledWith({ value: 42 });

    kernel.destroy();
  });

  it('should handle once() then regular on() for same event', () => {
    const kernel = createHealthKernel({ port: 0 });
    const context = kernel.getContext();

    const onceHandler = vi.fn();
    const regularHandler = vi.fn();

    // Add once handler first
    context.events.once('mixed:event', onceHandler);
    // Add regular handler (adds to existing Set)
    kernel.on('mixed:event', regularHandler);

    // First emit
    kernel.emit('mixed:event', { n: 1 });
    expect(onceHandler).toHaveBeenCalledTimes(1);
    expect(regularHandler).toHaveBeenCalledTimes(1);

    // Second emit - once handler should not be called
    kernel.emit('mixed:event', { n: 2 });
    expect(onceHandler).toHaveBeenCalledTimes(1);
    expect(regularHandler).toHaveBeenCalledTimes(2);

    kernel.destroy();
  });
});
