import { calculateDays, isPastDate } from '../../../shared/utils/date.js';

describe('Date Utils', () => {
  describe('calculateDays', () => {
    it('should calculate days between two dates', () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-05');
      expect(calculateDays(startDate, endDate)).toBe(4);
    });

    it('should return 1 for same day', () => {
      const date = new Date('2026-01-01');
      expect(calculateDays(date, date)).toBe(1);
    });

    it('should handle leap year', () => {
      const startDate = new Date('2024-02-28');
      const endDate = new Date('2024-03-01');
      expect(calculateDays(startDate, endDate)).toBe(2);
    });

    it('should handle month boundaries', () => {
      const startDate = new Date('2026-01-30');
      const endDate = new Date('2026-02-02');
      expect(calculateDays(startDate, endDate)).toBe(3);
    });

    it('should handle year boundaries', () => {
      const startDate = new Date('2025-12-30');
      const endDate = new Date('2026-01-02');
      expect(calculateDays(startDate, endDate)).toBe(3);
    });
  });

  describe('isPastDate', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01');
      expect(isPastDate(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date('2030-01-01');
      expect(isPastDate(futureDate)).toBe(false);
    });

    it('should return false for today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(isPastDate(today)).toBe(false);
    });
  });
});
