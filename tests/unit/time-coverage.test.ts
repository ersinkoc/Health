/**
 * @oxog/health - Time Utilities Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatDurationShort,
  formatUptime,
  measureTime,
  measureTimeSync,
  createTimer,
  relativeTime,
  nowIso,
  nowSeconds,
  nowMilliseconds,
} from '../../src/utils/time.js';
import { sleep } from '../../src/utils/promise.js';

describe('formatDurationShort Coverage', () => {
  it('should throw for negative values', () => {
    expect(() => formatDurationShort(-1)).toThrow('Duration cannot be negative');
    expect(() => formatDurationShort(-1000)).toThrow('Duration cannot be negative');
  });

  it('should format 0 as 0s', () => {
    expect(formatDurationShort(0)).toBe('0s');
  });

  it('should format milliseconds', () => {
    expect(formatDurationShort(1)).toBe('1ms');
    expect(formatDurationShort(500)).toBe('500ms');
    expect(formatDurationShort(999)).toBe('999ms');
  });

  it('should format seconds', () => {
    expect(formatDurationShort(1000)).toBe('1s');
    expect(formatDurationShort(1500)).toBe('1.5s');
    expect(formatDurationShort(30000)).toBe('30s');
  });

  it('should format minutes', () => {
    expect(formatDurationShort(60000)).toBe('1m');
    expect(formatDurationShort(90000)).toBe('1.5m');
    expect(formatDurationShort(300000)).toBe('5m');
  });

  it('should format hours', () => {
    expect(formatDurationShort(3600000)).toBe('1h');
    expect(formatDurationShort(5400000)).toBe('1.5h');
    expect(formatDurationShort(7200000)).toBe('2h');
  });

  it('should format days', () => {
    expect(formatDurationShort(86400000)).toBe('1d');
    expect(formatDurationShort(129600000)).toBe('1.5d');
    expect(formatDurationShort(172800000)).toBe('2d');
  });
});

describe('formatDuration Coverage', () => {
  it('should format various durations', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(1000)).toContain('1');
    expect(formatDuration(60000)).toContain('1');
    expect(formatDuration(3600000)).toContain('1');
    expect(formatDuration(86400000)).toContain('1');
  });

  it('should throw for negative values', () => {
    expect(() => formatDuration(-1)).toThrow('Duration cannot be negative');
  });
});

describe('formatUptime Coverage', () => {
  it('should format uptime in seconds', () => {
    expect(formatUptime(0)).toBeDefined();
    expect(formatUptime(60)).toContain('1');
    expect(formatUptime(3600)).toContain('1');
    expect(formatUptime(86400)).toContain('1');
  });
});

describe('measureTime Coverage', () => {
  it('should measure async function time', async () => {
    const { result, time } = await measureTime(async () => {
      await sleep(10);
      return 'async test';
    });

    expect(result).toBe('async test');
    expect(time).toBeGreaterThanOrEqual(0);
  });
});

describe('measureTimeSync Coverage', () => {
  it('should measure sync function time', () => {
    const { result, time } = measureTimeSync(() => {
      return 'sync test';
    });

    expect(result).toBe('sync test');
    expect(time).toBeGreaterThanOrEqual(0);
  });
});

describe('createTimer Coverage', () => {
  it('should create a timer', async () => {
    const timer = createTimer();

    expect(timer.start).toBeDefined();
    expect(timer.elapsed()).toBeGreaterThanOrEqual(0);

    await sleep(20);

    const elapsed = timer.elapsed();
    expect(elapsed).toBeGreaterThanOrEqual(15);

    const resetElapsed = timer.reset();
    expect(resetElapsed).toBeGreaterThanOrEqual(10);
    // After reset, elapsed should be relatively small (within 50ms of reset)
    expect(timer.elapsed()).toBeLessThanOrEqual(50);
  });
});

describe('relativeTime Coverage', () => {
  it('should format recent dates', () => {
    const now = new Date();
    expect(relativeTime(now)).toBeDefined();
  });

  it('should format dates from strings', () => {
    const dateStr = new Date().toISOString();
    expect(relativeTime(dateStr)).toBeDefined();
  });
});

describe('Time Utility Functions Coverage', () => {
  it('should get current ISO time', () => {
    const iso = nowIso();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should get current seconds', () => {
    const secs = nowSeconds();
    expect(secs).toBeGreaterThan(0);
  });

  it('should get current milliseconds', () => {
    const ms = nowMilliseconds();
    expect(ms).toBeGreaterThan(0);
  });
});
