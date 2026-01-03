import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatDuration,
  formatDurationShort,
  formatUptime,
  nowIso,
  nowSeconds,
  nowMilliseconds,
  parseIsoDate,
  formatIsoDate,
  msToSeconds,
  secondsToMs,
  minutesToMs,
  hoursToMs,
  daysToMs,
  createTimer,
  measureTime,
  measureTimeSync,
  relativeTime,
} from '../../src/utils/time.js';

// Helper function for async delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('time.ts - Duration Formatting', () => {
  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5s');
    });

    it('should format minutes', () => {
      expect(formatDuration(300000)).toBe('5m');
    });

    it('should format hours', () => {
      expect(formatDuration(3600000)).toBe('1h');
    });

    it('should format days', () => {
      expect(formatDuration(86400000)).toBe('1d');
    });

    it('should format complex durations', () => {
      // 1d 1h 1m 1s (ms only shows when no other parts)
      expect(formatDuration(90061000)).toBe('1d 1h 1m 1s');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should throw on negative values', () => {
      expect(() => formatDuration(-100)).toThrow('Duration cannot be negative');
    });
  });

  describe('formatDurationShort', () => {
    it('should format with short units', () => {
      expect(formatDurationShort(5000)).toBe('5s');
      expect(formatDurationShort(300000)).toBe('5m');
    });

    it('should format milliseconds', () => {
      expect(formatDurationShort(500)).toBe('500ms');
    });

    it('should format zero', () => {
      expect(formatDurationShort(0)).toBe('0s');
    });
  });

  describe('formatUptime', () => {
    it('should format uptime in human readable format', () => {
      expect(formatUptime(65)).toBe('1m 5s');
      expect(formatUptime(3665)).toBe('1h 1m 5s');
      expect(formatUptime(90061)).toBe('1d 1h 1m 1s');
    });

    it('should handle zero', () => {
      expect(formatUptime(0)).toBe('0s');
    });

    it('should throw on negative values', () => {
      expect(() => formatUptime(-100)).toThrow('Uptime cannot be negative');
    });
  });
});

describe('time.ts - Time Functions', () => {
  describe('nowIso', () => {
    it('should return ISO date string', () => {
      const result = nowIso();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('nowSeconds', () => {
    it('should return current time in seconds', () => {
      const result = nowSeconds();
      const now = Math.floor(Date.now() / 1000);
      expect(result).toBe(now);
    });
  });

  describe('nowMilliseconds', () => {
    it('should return current time in milliseconds', () => {
      const before = Date.now();
      const result = nowMilliseconds();
      const after = Date.now();
      // Result should be between before and after (allowing for timing)
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });
});

describe('time.ts - Date Parsing', () => {
  describe('parseIsoDate', () => {
    it('should parse ISO date string', () => {
      const result = parseIsoDate('2024-01-15T10:30:00.000Z');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    it('should handle invalid date', () => {
      const result = parseIsoDate('invalid');
      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(true);
    });

    it('should pass through Date objects', () => {
      const date = new Date();
      const result = parseIsoDate(date);
      expect(result).toBe(date);
    });
  });

  describe('formatIsoDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = formatIsoDate(date);
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });
  });
});

describe('time.ts - Time Unit Conversions', () => {
  it('should convert ms to seconds (floored)', () => {
    expect(msToSeconds(5000)).toBe(5);
    expect(msToSeconds(1500)).toBe(1);
  });

  it('should convert seconds to ms', () => {
    expect(secondsToMs(5)).toBe(5000);
    expect(secondsToMs(1.5)).toBe(1500);
  });

  it('should convert minutes to ms', () => {
    expect(minutesToMs(5)).toBe(300000);
  });

  it('should convert hours to ms', () => {
    expect(hoursToMs(2)).toBe(7200000);
  });

  it('should convert days to ms', () => {
    expect(daysToMs(7)).toBe(604800000);
  });
});

describe('time.ts - Timer Functions', () => {
  describe('createTimer', () => {
    it('should create a timer with elapsed method', async () => {
      const timer = createTimer();
      await sleep(50);
      const elapsed = timer.elapsed();
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });

    it('should reset timer', async () => {
      const timer = createTimer();
      await sleep(30);
      const afterFirst = timer.elapsed();
      const resetValue = timer.reset();
      expect(afterFirst).toBeGreaterThanOrEqual(25);
      expect(resetValue).toBeGreaterThanOrEqual(25);
      // Reset should return a value close to afterFirst (within timing tolerance)
      expect(Math.abs(resetValue - afterFirst)).toBeLessThan(5);
    });

    it('should have start property', () => {
      const timer = createTimer();
      expect(timer.start).toBeDefined();
      expect(typeof timer.start).toBe('number');
    });
  });

  describe('measureTime', () => {
    it('should return result with timing', async () => {
      const { result, time } = await measureTime(async () => {
        await sleep(50);
        return 'done';
      });
      expect(result).toBe('done');
      expect(time).toBeGreaterThanOrEqual(45);
      expect(time).toBeLessThan(100);
    });

    it('should handle sync function passed to measureTime', async () => {
      const { result, time } = await measureTime(() => {
        return 'sync done';
      });
      expect(result).toBe('sync done');
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });

  describe('measureTimeSync', () => {
    it('should return result with timing for sync function', () => {
      const { result, time } = measureTimeSync(() => {
        return 'sync done';
      });
      expect(result).toBe('sync done');
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('time.ts - Relative Time', () => {
  describe('relativeTime', () => {
    it('should show "just now" for recent times', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 30000); // 30 seconds ago
      const result = relativeTime(past);
      expect(result).toBe('just now');
    });

    it('should show minutes ago', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 180000); // 3 minutes ago
      const result = relativeTime(past);
      expect(result).toBe('3 minutes ago');
    });

    it('should show hours ago', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 7200000); // 2 hours ago
      const result = relativeTime(past);
      expect(result).toBe('2 hours ago');
    });

    it('should show days ago', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 172800000); // 2 days ago
      const result = relativeTime(past);
      expect(result).toBe('2 days ago');
    });

    it('should format date for old dates', () => {
      const oldDate = new Date('2020-01-01');
      const result = relativeTime(oldDate);
      // Returns full ISO string for dates older than 7 days
      expect(result).toContain('2020-01-01');
    });

    it('should handle string dates', () => {
      const result = relativeTime('2020-01-01T00:00:00.000Z');
      expect(result).toContain('2020-01-01');
    });
  });
});
