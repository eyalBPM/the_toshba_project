export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export function toPaginated<T extends { id: string }>(
  items: T[],
  limit: number,
): PaginatedResult<T> {
  const hasMore = items.length === limit;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

export function parsePaginationParams(url: URL): { cursor?: string; limit: number } {
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const rawLimit = url.searchParams.get('limit');
  const limit = rawLimit ? Math.min(parseInt(rawLimit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  return { cursor, limit };
}
