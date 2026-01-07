/**
 * @oxog/health - Time Relative Singular Forms Coverage Tests
 */

import { describe, it, expect } from 'vitest';
import { relativeTime } from '../../src/utils/time.js';

describe('Time Relative Singular Forms', () => {
  it('should return "1 minute ago" for exactly 1 minute', () => {
    const now = new Date();
    const then = new Date(now.getTime() - 60 * 1000); // 1 minute ago

    // Triggers line 374 - singular "minute"
    const result = relativeTime(then);
    expect(result).toBe('1 minute ago');
  });

  it('should return "2 minutes ago" for 2 minutes', () => {
    const now = new Date();
    const then = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago

    const result = relativeTime(then);
    expect(result).toBe('2 minutes ago');
  });

  it('should return "1 hour ago" for exactly 1 hour', () => {
    const now = new Date();
    const then = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    // Triggers line 378 - singular "hour"
    const result = relativeTime(then);
    expect(result).toBe('1 hour ago');
  });

  it('should return "2 hours ago" for 2 hours', () => {
    const now = new Date();
    const then = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

    const result = relativeTime(then);
    expect(result).toBe('2 hours ago');
  });

  it('should return "1 day ago" for exactly 1 day', () => {
    const now = new Date();
    const then = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

    // Triggers line 382 - singular "day"
    const result = relativeTime(then);
    expect(result).toBe('1 day ago');
  });

  it('should return "2 days ago" for 2 days', () => {
    const now = new Date();
    const then = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

    const result = relativeTime(then);
    expect(result).toBe('2 days ago');
  });
});
