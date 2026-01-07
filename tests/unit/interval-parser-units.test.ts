/**
 * @oxog/health - Interval Parser Unit Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { IntervalParser } from '../../src/core/interval-parser.js';

describe('IntervalParser Unit Resolution', () => {
  const parser = new IntervalParser();

  it('should return unit "ms" for millisecond intervals', () => {
    const result = parser.parse('100ms');
    expect(result.unit).toBe('ms');
    expect(result.value).toBe(100);
  });

  it('should return unit "s" for second intervals', () => {
    const result = parser.parse('5s');
    expect(result.unit).toBe('s');
    expect(result.value).toBe(5);
  });

  it('should return unit "m" for minute intervals', () => {
    const result = parser.parse('10m');
    expect(result.unit).toBe('m');
    expect(result.value).toBe(10);
  });

  it('should return unit "h" for hour intervals', () => {
    const result = parser.parse('2h');
    expect(result.unit).toBe('h');
    expect(result.value).toBe(2);
  });

  it('should return unit "d" for day intervals', () => {
    const result = parser.parse('1d');
    expect(result.unit).toBe('d');
    expect(result.value).toBe(1);
  });
});

describe('IntervalParser Format Coverage', () => {
  const parser = new IntervalParser();

  it('should format duration with seconds', () => {
    // 65 seconds = 1m 5s
    const formatted = parser.format(65000);
    expect(formatted).toContain('1m');
    expect(formatted).toContain('5s');
  });

  it('should format duration with only seconds', () => {
    // 30 seconds
    const formatted = parser.format(30000);
    expect(formatted).toBe('30s');
  });

  it('should format duration with hours, minutes and seconds', () => {
    // 1 hour, 30 minutes, 45 seconds
    const formatted = parser.format(5445000);
    expect(formatted).toContain('1h');
    expect(formatted).toContain('30m');
    expect(formatted).toContain('45s');
  });

  it('should format duration with days and hours', () => {
    // 1 day, 2 hours
    const formatted = parser.format(93600000);
    expect(formatted).toContain('1d');
    expect(formatted).toContain('2h');
  });

  it('should format small millisecond values', () => {
    const formatted = parser.format(50);
    expect(formatted).toBe('50ms');
  });
});
