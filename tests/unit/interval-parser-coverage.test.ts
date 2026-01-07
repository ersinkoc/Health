/**
 * @oxog/health - Interval Parser Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { intervalParser, IntervalParser } from '../../src/core/interval-parser.js';

describe('IntervalParser formatShort', () => {
  const parser = new IntervalParser();

  it('should format 0 as 0s', () => {
    expect(parser.formatShort(0)).toBe('0s');
  });

  it('should format milliseconds', () => {
    expect(parser.formatShort(500)).toBe('500ms');
    expect(parser.formatShort(1)).toBe('1ms');
  });

  it('should format seconds', () => {
    expect(parser.formatShort(5000)).toBe('5s');
    expect(parser.formatShort(5500)).toBe('5.5s');
    expect(parser.formatShort(30000)).toBe('30s');
  });

  it('should format minutes', () => {
    expect(parser.formatShort(60000)).toBe('1m');
    expect(parser.formatShort(90000)).toBe('1.5m');
    expect(parser.formatShort(300000)).toBe('5m');
  });

  it('should format hours', () => {
    expect(parser.formatShort(3600000)).toBe('1h');
    expect(parser.formatShort(5400000)).toBe('1.5h');
    expect(parser.formatShort(7200000)).toBe('2h');
  });

  it('should format days', () => {
    expect(parser.formatShort(86400000)).toBe('1d');
    expect(parser.formatShort(129600000)).toBe('1.5d');
    expect(parser.formatShort(172800000)).toBe('2d');
  });

  it('should throw for invalid values', () => {
    expect(() => parser.formatShort(Infinity)).toThrow();
    expect(() => parser.formatShort(-1000)).toThrow();
    expect(() => parser.formatShort(NaN)).toThrow();
  });
});

describe('IntervalParser isValid', () => {
  const parser = new IntervalParser();

  it('should return true for valid string intervals', () => {
    expect(parser.isValid('30s')).toBe(true);
    expect(parser.isValid('5m')).toBe(true);
    expect(parser.isValid('1h')).toBe(true);
    expect(parser.isValid('1d')).toBe(true);
  });

  it('should return true for valid numbers', () => {
    expect(parser.isValid(5000)).toBe(true);
    expect(parser.isValid(0)).toBe(true);
  });

  it('should return false for invalid values', () => {
    expect(parser.isValid('invalid')).toBe(false);
    expect(parser.isValid('10x')).toBe(false);
    expect(parser.isValid(-100)).toBe(false);
  });
});

describe('IntervalParser getUnit', () => {
  const parser = new IntervalParser();

  it('should return correct unit for string intervals', () => {
    expect(parser.getUnit('30s')).toBe('s');
    expect(parser.getUnit('5m')).toBe('m');
    expect(parser.getUnit('1h')).toBe('h');
    expect(parser.getUnit('1d')).toBe('d');
    expect(parser.getUnit('500ms')).toBe('ms');
  });

  it('should return ms for numbers', () => {
    expect(parser.getUnit(5000)).toBe('ms');
  });

  it('should return null for invalid values', () => {
    expect(parser.getUnit('invalid')).toBeNull();
    expect(parser.getUnit('10x')).toBeNull();
  });
});

describe('IntervalParser convert', () => {
  const parser = new IntervalParser();

  it('should convert between units', () => {
    expect(parser.convert(5, 'm', 's')).toBe(300);
    expect(parser.convert(1, 'h', 'm')).toBe(60);
    expect(parser.convert(1, 'd', 'h')).toBe(24);
    expect(parser.convert(1000, 'ms', 's')).toBe(1);
  });

  it('should convert to milliseconds', () => {
    expect(parser.convert(5, 's', 'ms')).toBe(5000);
    expect(parser.convert(1, 'm', 'ms')).toBe(60000);
    expect(parser.convert(1, 'h', 'ms')).toBe(3600000);
  });

  it('should handle same unit conversion', () => {
    expect(parser.convert(100, 's', 's')).toBe(100);
    expect(parser.convert(100, 'm', 'm')).toBe(100);
  });
});

describe('IntervalParser singleton', () => {
  it('should be an instance of IntervalParser', () => {
    expect(intervalParser).toBeInstanceOf(IntervalParser);
  });

  it('should parse intervals', () => {
    expect(intervalParser.parse('30s').milliseconds).toBe(30000);
  });
});
