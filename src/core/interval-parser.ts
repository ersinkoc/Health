/**
 * @oxog/health - Interval Parser
 *
 * Parse duration strings like '30s', '5m', '1h' to milliseconds.
 * @packageDocumentation
 */

import type { IntervalValue } from '../types.js';
import { InvalidIntervalError } from '../errors.js';

// ============================================================================
// Patterns
// ============================================================================

/**
 * Regular expression patterns for parsing interval strings.
 */
const PATTERNS = [
  { regex: /^(\d+)$/, multiplier: 1 },  // Plain number (interpreted as ms)
  { regex: /^(\d+)ms$/, multiplier: 1 },
  { regex: /^(\d+)s$/, multiplier: 1000 },
  { regex: /^(\d+)m$/, multiplier: 60 * 1000 },
  { regex: /^(\d+)h$/, multiplier: 60 * 60 * 1000 },
  { regex: /^(\d+)d$/, multiplier: 24 * 60 * 60 * 1000 },
] as const;

// ============================================================================
// Types
// ============================================================================

/**
 * Parsed interval result.
 */
export interface ParsedInterval {
  /** Value in milliseconds */
  milliseconds: number;
  /** Original expression */
  expression: string;
  /** Parsed unit type */
  unit: 'ms' | 's' | 'm' | 'h' | 'd';
  /** Numeric value without unit */
  value: number;
}

// ============================================================================
// Parser Class
// ============================================================================

/**
 * Interval parser for converting duration strings to milliseconds.
 *
 * @example
 * ```typescript
 * const parser = new IntervalParser();
 * const result = parser.parse('30s');
 * // { milliseconds: 30000, expression: '30s', unit: 's', value: 30 }
 * ```
 */
export class IntervalParser {
  /**
   * Parse an interval string or number to milliseconds.
   *
   * @param input - Interval value (e.g., '30s', '5m', 30000)
   * @returns Parsed interval result
   * @throws InvalidIntervalError for invalid formats
   *
   * @example
   * ```typescript
   * parser.parse('10s');    // { milliseconds: 10000, ... }
   * parser.parse('5m');     // { milliseconds: 300000, ... }
   * parser.parse('1h');     // { milliseconds: 3600000, ... }
   * parser.parse(5000);     // { milliseconds: 5000, ... }
   * ```
   */
  parse(input: IntervalValue): ParsedInterval {
    if (typeof input === 'number') {
      if (!Number.isFinite(input) || input < 0) {
        throw new InvalidIntervalError(String(input));
      }
      return {
        milliseconds: input,
        expression: `${input}ms`,
        unit: 'ms',
        value: input,
      };
    }

    const trimmed = input.trim();

    if (!trimmed) {
      throw new InvalidIntervalError('"' + input + '"');
    }

    for (const pattern of PATTERNS) {
      const match = trimmed.match(pattern.regex);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        if (!Number.isFinite(value) || value < 0) {
          throw new InvalidIntervalError(trimmed);
        }
        return {
          milliseconds: value * pattern.multiplier,
          expression: trimmed,
          unit: pattern.multiplier === 1 ? 'ms' :
                pattern.multiplier === 1000 ? 's' :
                pattern.multiplier === 60 * 1000 ? 'm' :
                pattern.multiplier === 60 * 60 * 1000 ? 'h' : 'd',
          value,
        };
      }
    }

    throw new InvalidIntervalError(trimmed);
  }

  /**
   * Format milliseconds to a duration string.
   *
   * @param ms - Duration in milliseconds
   * @returns Formatted duration string
   *
   * @example
   * ```typescript
   * parser.format(5000);      // '5s'
   * parser.format(90000);     // '1m 30s'
   * parser.format(3661000);   // '1h 1m'
   * ```
   */
  format(ms: number): string {
    if (!Number.isFinite(ms) || ms < 0) {
      throw new InvalidIntervalError(String(ms));
    }

    if (ms === 0) {
      return '0s';
    }

    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    const milliseconds = ms % 1000;

    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days}d`);
    }
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (seconds > 0) {
      parts.push(`${seconds}s`);
    }
    if (milliseconds > 0 && parts.length === 0) {
      parts.push(`${milliseconds}ms`);
    }

    return parts.join(' ');
  }

  /**
   * Format milliseconds to a short duration string.
   *
   * @param ms - Duration in milliseconds
   * @returns Short formatted duration string
   *
   * @example
   * ```typescript
   * parser.formatShort(5000);   // '5s'
   * parser.formatShort(90000);  // '1.5m'
   * parser.formatShort(3661000); // '1h'
   * ```
   */
  formatShort(ms: number): string {
    if (!Number.isFinite(ms) || ms < 0) {
      throw new InvalidIntervalError(String(ms));
    }

    if (ms === 0) {
      return '0s';
    }

    if (ms < 1000) {
      return `${ms}ms`;
    }

    if (ms < 60 * 1000) {
      return `${(ms / 1000).toFixed(1)}s`.replace(/\.0s$/, 's');
    }

    if (ms < 60 * 60 * 1000) {
      return `${(ms / (60 * 1000)).toFixed(1)}m`.replace(/\.0m$/, 'm');
    }

    if (ms < 24 * 60 * 60 * 1000) {
      return `${(ms / (60 * 60 * 1000)).toFixed(1)}h`.replace(/\.0h$/, 'h');
    }

    return `${(ms / (24 * 60 * 60 * 1000)).toFixed(1)}d`.replace(/\.0d$/, 'd');
  }

  /**
   * Check if a string is a valid interval format.
   *
   * @param input - Value to check
   * @returns True if valid interval format
   *
   * @example
   * ```typescript
   * parser.isValid('30s');   // true
   * parser.isValid('5m');    // true
   * parser.isValid(5000);    // true
   * parser.isValid('invalid'); // false
   * ```
   */
  isValid(input: IntervalValue): boolean {
    try {
      this.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the unit of an interval string.
   *
   * @param input - Interval value
   * @returns Unit type or null if invalid
   *
   * @example
   * ```typescript
   * parser.getUnit('30s');   // 's'
   * parser.getUnit('5m');    // 'm'
   * parser.getUnit(5000);    // 'ms'
   * ```
   */
  getUnit(input: IntervalValue): 'ms' | 's' | 'm' | 'h' | 'd' | null {
    try {
      return this.parse(input).unit;
    } catch {
      return null;
    }
  }

  /**
   * Convert between units.
   *
   * @param value - Value to convert
   * @param fromUnit - Source unit
   * @param toUnit - Target unit
   * @returns Converted value
   *
   * @example
   * ```typescript
   * parser.convert(5, 'm', 's');   // 300
   * parser.convert(1, 'h', 'm');   // 60
   * ```
   */
  convert(
    value: number,
    fromUnit: 'ms' | 's' | 'm' | 'h' | 'd',
    toUnit: 'ms' | 's' | 'm' | 'h' | 'd'
  ): number {
    const unitToMs: Record<'ms' | 's' | 'm' | 'h' | 'd', number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const inMs = value * unitToMs[fromUnit];
    return inMs / unitToMs[toUnit];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default interval parser instance.
 */
export const intervalParser = new IntervalParser();

/**
 * Parse an interval string to milliseconds.
 *
 * @example
 * ```typescript
 * const ms = parseInterval('30s');
 * // 30000
 * ```
 */
export function parseInterval(input: IntervalValue): number {
  return intervalParser.parse(input).milliseconds;
}

/**
 * Format milliseconds to a duration string.
 *
 * @example
 * ```typescript
 * const str = formatInterval(30000);
 * // '30s'
 * ```
 */
export function formatInterval(ms: number): string {
  return intervalParser.format(ms);
}
