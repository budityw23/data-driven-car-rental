import { describe, it, expect } from 'vitest';
import { dateUtils } from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('calculateDays', () => {
    it('should calculate correct difference between two dates', () => {
      const start = '2024-01-01';
      const end = '2024-01-05';
      expect(dateUtils.calculateDays(start, end)).toBe(4);
    });

    it('should return 1 if start and end are the same', () => {
      const start = '2024-01-01';
      const end = '2024-01-01';
      expect(dateUtils.calculateDays(start, end)).toBe(1); // Assuming minimum 1 day rental policy if handled there, or logic choice
    });

    it('should handle dates across months', () => {
      const start = '2024-01-31';
      const end = '2024-02-02';
      expect(dateUtils.calculateDays(start, end)).toBe(2);
    });
  });

  describe('formatDate', () => {
    it('should format simple date correctly', () => {
      const date = '2024-01-01';
      expect(dateUtils.formatDate(date)).toBe('Jan 01, 2024');
    });
  });
});
