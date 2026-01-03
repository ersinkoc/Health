/**
 * @oxog/health - Interval Parser Tests
 */

import { describe, it, expect } from 'vitest';
import { IntervalParser, parseInterval, formatInterval } from '../../src/core/interval-parser.js';

describe('IntervalParser', () => {
  describe('parse', () => {
    it('should parse seconds', () => {
      const parser = new IntervalParser();
      const result = parser.parse('30s');
      expect(result.milliseconds).toBe(30000);
      expect(result.unit).toBe('s');
      expect(result.value).toBe(30);
    });

    it('should parse minutes', () => {
      const parser = new IntervalParser();
      const result = parser.parse('5m');
      expect(result.milliseconds).toBe(300000);
      expect(result.unit).toBe('m');
      expect(result.value).toBe(5);
    });

    it('should parse hours', () => {
      const parser = new IntervalParser();
      const result = parser.parse('1h');
      expect(result.milliseconds).toBe(3600000);
      expect(result.unit).toBe('h');
      expect(result.value).toBe(1);
    });

    it('should parse days', () => {
      const parser = new IntervalParser();
      const result = parser.parse('2d');
      expect(result.milliseconds).toBe(172800000);
      expect(result.unit).toBe('d');
      expect(result.value).toBe(2);
    });

    it('should parse milliseconds', () => {
      const parser = new IntervalParser();
      const result = parser.parse('500ms');
      expect(result.milliseconds).toBe(500);
      expect(result.unit).toBe('ms');
      expect(result.value).toBe(500);
    });

    it('should parse numeric input', () => {
      const parser = new IntervalParser();
      const result = parser.parse(5000);
      expect(result.milliseconds).toBe(5000);
      expect(result.unit).toBe('ms');
      expect(result.value).toBe(5000);
    });

    it('should throw on invalid format', () => {
      const parser = new IntervalParser();
      expect(() => parser.parse('invalid')).toThrow();
      expect(() => parser.parse('10x')).toThrow();
      expect(() => parser.parse('')).toThrow();
    });

    it('should throw on negative values', () => {
      const parser = new IntervalParser();
      expect(() => parser.parse('-5s')).toThrow();
      expect(() => parser.parse(-1000)).toThrow();
    });
  });

  describe('format', () => {
    it('should format milliseconds', () => {
      const parser = new IntervalParser();
      expect(parser.format(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      const parser = new IntervalParser();
      expect(parser.format(5000)).toBe('5s');
    });

    it('should format minutes', () => {
      const parser = new IntervalParser();
      expect(parser.format(120000)).toBe('2m');
    });

    it('should format complex duration', () => {
      const parser = new IntervalParser();
      expect(parser.format(90000)).toBe('1m 30s');
    });

    it('should format zero', () => {
      const parser = new IntervalParser();
      expect(parser.format(0)).toBe('0s');
    });

    it('should throw on negative values', () => {
      const parser = new IntervalParser();
      expect(() => parser.format(-1000)).toThrow();
    });
  });

  describe('isValid', () => {
    const parser = new IntervalParser();

    it('should return true for valid formats', () => {
      expect(parser.isValid('30s')).toBe(true);
      expect(parser.isValid('5m')).toBe(true);
      expect(parser.isValid('1h')).toBe(true);
      expect(parser.isValid('5000')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(parser.isValid('invalid')).toBe(false);
      expect(parser.isValid('10x')).toBe(false);
      expect(parser.isValid('')).toBe(false);
    });
  });

  describe('getUnit', () => {
    const parser = new IntervalParser();

    it('should return correct unit', () => {
      expect(parser.getUnit('30s')).toBe('s');
      expect(parser.getUnit('5m')).toBe('m');
      expect(parser.getUnit('1h')).toBe('h');
      expect(parser.getUnit('500ms')).toBe('ms');
      expect(parser.getUnit(5000)).toBe('ms');
    });

    it('should return null for invalid input', () => {
      expect(parser.getUnit('invalid')).toBeNull();
    });
  });
});

describe('parseInterval', () => {
  it('should parse string interval', () => {
    expect(parseInterval('30s')).toBe(30000);
    expect(parseInterval('5m')).toBe(300000);
  });

  it('should parse numeric interval', () => {
    expect(parseInterval(5000)).toBe(5000);
  });
});

describe('formatInterval', () => {
  it('should format milliseconds', () => {
    expect(formatInterval(5000)).toBe('5s');
    expect(formatInterval(90000)).toBe('1m 30s');
  });
});
