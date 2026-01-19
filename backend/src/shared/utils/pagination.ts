export interface PaginationInput {
  page?: string | number;
  limit?: string | number;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(input: PaginationInput): PaginationConfig {
  let page = typeof input.page === 'string' ? parseInt(input.page, 10) : input.page;
  let limit = typeof input.limit === 'string' ? parseInt(input.limit, 10) : input.limit;
  page = page && page > 0 ? page : DEFAULT_PAGE;
  limit = limit && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
}
