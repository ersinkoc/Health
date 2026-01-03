/**
 * @oxog/health - Time Utilities
 *
 * Zero-dependency time utilities for duration formatting and parsing.
 * @packageDocumentation
 */

// ============================================================================
// Duration Formatting
// ============================================================================

/**
 * Format milliseconds to a human-readable duration string.
 *
 * @example
 * ```typescript
 * formatDuration(5000);      // '5s'
 * formatDuration(90000);     // '1m 30s'
 * formatDuration(3661000);   // '1h 1m 1s'
 * ```
 */
export function formatDuration(ms: number): string {
  if (ms < 0) {
    throw new Error('Duration cannot be negative');
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
 * @example
 * ```typescript
 * formatDurationShort(5000);   // '5s'
 * formatDurationShort(90000);  // '1.5m'
 * formatDurationShort(3661000); // '1.0h'
 * ```
 */
export function formatDurationShort(ms: number): string {
  if (ms < 0) {
    throw new Error('Duration cannot be negative');
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
 * Format seconds to a human-readable uptime string.
 *
 * @example
 * ```typescript
 * formatUptime(3600);      // '1h 0m 0s'
 * formatUptime(86400);     // '1d 0h 0m'
 * ```
 */
export function formatUptime(seconds: number): string {
  if (seconds < 0) {
    throw new Error('Uptime cannot be negative');
  }

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = Math.floor(seconds % 60);

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
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
}

// ============================================================================
// Timestamp Utilities
// ============================================================================

/**
 * Get the current ISO timestamp.
 *
 * @example
 * ```typescript
 * const now = nowIso();
 * // '2024-01-15T10:30:00.000Z'
 * ```
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Get the current Unix timestamp in seconds.
 *
 * @example
 * ```typescript
 * const now = nowSeconds();
 * // 1705315800
 * ```
 */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get the current Unix timestamp in milliseconds.
 *
 * @example
 * ```typescript
 * const now = nowMilliseconds();
 * // 1705315800000
 * ```
 */
export function nowMilliseconds(): number {
  return Date.now();
}

/**
 * Parse an ISO date string to a Date object.
 *
 * @example
 * ```typescript
 * const date = parseIsoDate('2024-01-15T10:30:00.000Z');
 * ```
 */
export function parseIsoDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
}

/**
 * Format a date to ISO string.
 *
 * @example
 * ```typescript
 * const formatted = formatIsoDate(new Date());
 * // '2024-01-15T10:30:00.000Z'
 * ```
 */
export function formatIsoDate(date: Date = new Date()): string {
  return date.toISOString();
}

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * Convert milliseconds to seconds.
 *
 * @example
 * ```typescript
 * const seconds = msToSeconds(5000);
 * // 5
 * ```
 */
export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

/**
 * Convert seconds to milliseconds.
 *
 * @example
 * ```typescript
 * const ms = secondsToMs(5);
 * // 5000
 * ```
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Convert minutes to milliseconds.
 *
 * @example
 * ```typescript
 * const ms = minutesToMs(5);
 * // 300000
 * ```
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Convert hours to milliseconds.
 *
 * @example
 * ```typescript
 * const ms = hoursToMs(2);
 * // 7200000
 * ```
 */
export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/**
 * Convert days to milliseconds.
 *
 * @example
 * ```typescript
 * const ms = daysToMs(7);
 * // 604800000
 * ```
 */
export function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

// ============================================================================
// Elapsed Time
// ============================================================================

/**
 * Create a timer that measures elapsed time.
 *
 * @example
 * ```typescript
 * const timer = createTimer();
 * await someAsyncOperation();
 * const elapsed = timer.elapsed();
 * // 150 (milliseconds)
 * ```
 */
export function createTimer(): { start: number; elapsed: () => number; reset: () => number } {
  const start = Date.now();

  return {
    get start(): number {
      return start;
    },
    elapsed: (): number => {
      return Date.now() - start;
    },
    reset: (): number => {
      const elapsed = Date.now() - start;
      // Reset by creating a new timer context (closure captures new start)
      Object.defineProperty(this, 'start', { value: Date.now() });
      return elapsed;
    },
  };
}

/**
 * Measure the execution time of a function.
 *
 * @example
 * ```typescript
 * const { result, time } = measureTime(async () => {
 *   return await someAsyncOperation();
 * });
 * console.log(`Operation took ${time}ms`);
 * ```
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; time: number }> {
  const start = Date.now();
  const result = await fn();
  const time = Date.now() - start;
  return { result, time };
}

/**
 * Measure the execution time of a synchronous function.
 *
 * @example
 * ```typescript
 * const { result, time } = measureTimeSync(() => {
 *   return someSynchronousOperation();
 * });
 * console.log(`Operation took ${time}ms`);
 * ```
 */
export function measureTimeSync<T>(
  fn: () => T
): { result: T; time: number } {
  const start = Date.now();
  const result = fn();
  const time = Date.now() - start;
  return { result, time };
}

// ============================================================================
// Relative Time
// ============================================================================

/**
 * Get a human-readable relative time string.
 *
 * @example
 * ```typescript
 * const ago = relativeTime(new Date(Date.now() - 60000));
 * // '1 minute ago'
 * ```
 */
export function relativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  return formatIsoDate(then);
}

// ============================================================================
