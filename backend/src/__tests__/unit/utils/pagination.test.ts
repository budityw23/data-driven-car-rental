import { parsePagination, buildPaginationMeta } from '../../../shared/utils/pagination.js';

describe('Pagination Utils', () => {
  describe('parsePagination', () => {
    it('should return default values when no input provided', () => {
      const result = parsePagination({});
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('should parse valid page and limit strings', () => {
      const result = parsePagination({ page: '2', limit: '50' });
      expect(result).toEqual({ page: 2, limit: 50 });
    });

    it('should handle invalid page number', () => {
      const result = parsePagination({ page: 'invalid', limit: '20' });
      expect(result.page).toBe(1);
    });

    it('should handle negative page number', () => {
      const result = parsePagination({ page: '-1', limit: '20' });
      expect(result.page).toBe(1);
    });

    it('should handle invalid limit', () => {
      const result = parsePagination({ page: '1', limit: 'invalid' });
      expect(result.limit).toBe(20);
    });

    it('should cap limit at 100', () => {
      const result = parsePagination({ page: '1', limit: '200' });
      expect(result.limit).toBe(100);
    });

    it('should handle zero limit', () => {
      const result = parsePagination({ page: '1', limit: '0' });
      expect(result.limit).toBe(20);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build correct metadata for first page', () => {
      const meta = buildPaginationMeta(1, 20, 100);
      expect(meta).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should build correct metadata for middle page', () => {
      const meta = buildPaginationMeta(3, 20, 100);
      expect(meta).toEqual({
        page: 3,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should build correct metadata for last page', () => {
      const meta = buildPaginationMeta(5, 20, 100);
      expect(meta).toEqual({
        page: 5,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should handle single page', () => {
      const meta = buildPaginationMeta(1, 20, 15);
      expect(meta).toEqual({
        page: 1,
        limit: 20,
        total: 15,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should handle zero total', () => {
      const meta = buildPaginationMeta(1, 20, 0);
      expect(meta).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });
});
