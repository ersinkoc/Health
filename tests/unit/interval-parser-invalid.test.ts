/**
 * @oxog/health - Interval Parser Invalid Values Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { IntervalParser, InvalidIntervalError } from '../../src/core/interval-parser.js';

describe('IntervalParser Invalid Values', () => {
  const parser = new IntervalParser();

  it('should throw on negative interval value', () => {
    // Triggers line 99 - negative value check
    expect(() => parser.parse('-5s')).toThrow(InvalidIntervalError);
  });

  it('should throw on NaN interval value', () => {
    // Invalid number
    expect(() => parser.parse('NaNs')).toThrow(InvalidIntervalError);
  });

  it('should throw on Infinity interval value', () => {
    // Triggers line 98-99 - Number.isFinite check
    expect(() => parser.parse('Infinitys')).toThrow(InvalidIntervalError);
  });

  it('should throw on invalid format', () => {
    // Triggers line 113
    expect(() => parser.parse('invalid')).toThrow(InvalidIntervalError);
  });

  it('should throw on empty string', () => {
    expect(() => parser.parse('')).toThrow(InvalidIntervalError);
  });
});
