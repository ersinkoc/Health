/**
 * @oxog/health - Interval Parser Full Unit Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { IntervalParser } from '../../src/core/interval-parser.js';

describe('IntervalParser Parse Units', () => {
  const parser = new IntervalParser();

  it('should parse and return correct unit for milliseconds', () => {
    const result = parser.parse('500ms');
    expect(result.unit).toBe('ms');
    expect(result.value).toBe(500);
    expect(result.milliseconds).toBe(500);
  });

  it('should parse and return correct unit for seconds', () => {
    const result = parser.parse('30s');
    expect(result.unit).toBe('s');
    expect(result.value).toBe(30);
    expect(result.milliseconds).toBe(30000);
  });

  it('should parse and return correct unit for minutes', () => {
    const result = parser.parse('5m');
    expect(result.unit).toBe('m');
    expect(result.value).toBe(5);
    expect(result.milliseconds).toBe(300000);
  });

  it('should parse and return correct unit for hours', () => {
    const result = parser.parse('2h');
    expect(result.unit).toBe('h');
    expect(result.value).toBe(2);
    expect(result.milliseconds).toBe(7200000);
  });

  it('should parse and return correct unit for days', () => {
    const result = parser.parse('1d');
    expect(result.unit).toBe('d');
    expect(result.value).toBe(1);
    expect(result.milliseconds).toBe(86400000);
  });
});

describe('IntervalParser Format with Seconds', () => {
  const parser = new IntervalParser();

  it('should format duration with seconds component', () => {
    // 1 minute and 30 seconds = 90000ms
    const formatted = parser.format(90000);
    expect(formatted).toContain('1m');
    expect(formatted).toContain('30s');
  });

  it('should format duration with hours, minutes, and seconds', () => {
    // 1 hour, 2 minutes, 3 seconds = 3723000ms
    const formatted = parser.format(3723000);
    expect(formatted).toContain('1h');
    expect(formatted).toContain('2m');
    expect(formatted).toContain('3s');
  });

  it('should format just seconds', () => {
    const formatted = parser.format(45000);
    expect(formatted).toBe('45s');
  });
});
