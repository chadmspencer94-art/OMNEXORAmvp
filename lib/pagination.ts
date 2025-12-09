/**
 * Pagination helper types and utilities
 */

export type PaginatedResult<T> = {
  items: T[];
  page: number; // current page (1-based)
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function buildPagination(pageParam: unknown, defaultPageSize = 20) {
  const page = Math.max(Number(pageParam) || 1, 1);
  const pageSize = defaultPageSize;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return { page, pageSize, skip, take };
}

/**
 * Helper to build paginated result
 */
export function buildPaginatedResult<T>(
  items: T[],
  page: number,
  pageSize: number,
  totalItems: number
): PaginatedResult<T> {
  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}

