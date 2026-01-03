import { describe, it, expect } from 'vitest';
import { isValidThreshold } from '../../src/plugins/optional/thresholds.js';

describe('thresholds.ts - Validation', () => {
  describe('isValidThreshold', () => {
    it('should return true for valid thresholds', () => {
      expect(isValidThreshold(0)).toBe(true);
      expect(isValidThreshold(50)).toBe(true);
      expect(isValidThreshold(100)).toBe(true);
    });

    it('should return false for invalid thresholds', () => {
      expect(isValidThreshold(-1)).toBe(false);
      expect(isValidThreshold(101)).toBe(false);
      expect(isValidThreshold(NaN)).toBe(false);
      expect(isValidThreshold(Infinity)).toBe(false);
      expect(isValidThreshold('50')).toBe(false);
      expect(isValidThreshold(null)).toBe(false);
      expect(isValidThreshold(undefined)).toBe(false);
    });
  });
});
