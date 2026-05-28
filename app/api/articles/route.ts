import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  listArticles,
  listArticlesForTable,
  type ArticleSortColumn,
  type SortDir,
} from '@/db/article-repository';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import {
  parsePaginationParams,
  toPaginated,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/pagination';

const sortSchema = z.enum(['title', 'sources', 'topics', 'sages', 'updatedAt']);
const dirSchema = z.enum(['asc', 'desc']);

function parseList(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function isBool(raw: string | null): boolean {
  return raw === '1' || raw === 'true';
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { cursor, limit } = parsePaginationParams(url);
    const search = url.searchParams.get('search') ?? undefined;

    // Detect whether any "table view" param is present. If not, fall back to
    // the legacy cursor-by-id behavior used by article autocomplete elsewhere.
    const sortRaw = url.searchParams.get('sort');
    const dirRaw = url.searchParams.get('dir');
    const books = parseList(url.searchParams.get('books'));
    const topicIds = parseList(url.searchParams.get('topicIds'));
    const sageIds = parseList(url.searchParams.get('sageIds'));
    const searchInContent = isBool(url.searchParams.get('searchInContent'));
    const isTableMode =
      sortRaw !== null ||
      dirRaw !== null ||
      books !== undefined ||
      topicIds !== undefined ||
      sageIds !== undefined ||
      searchInContent;

    if (!isTableMode) {
      const articles = await listArticles({ cursor, limit, search });
      return apiSuccess(toPaginated(articles, limit));
    }

    let sort: ArticleSortColumn | undefined;
    let dir: SortDir | undefined;
    if (sortRaw) {
      const parsed = sortSchema.safeParse(sortRaw);
      if (!parsed.success) return ApiErrors.badRequest('Invalid sort column');
      sort = parsed.data;
    }
    if (dirRaw) {
      const parsed = dirSchema.safeParse(dirRaw);
      if (!parsed.success) return ApiErrors.badRequest('Invalid sort direction');
      dir = parsed.data;
    }

    // Cursor in table mode is just the offset as a string.
    const offset = cursor ? Math.max(parseInt(cursor, 10) || 0, 0) : 0;
    const safeLimit = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE) || DEFAULT_PAGE_SIZE;

    const { items, total } = await listArticlesForTable({
      offset,
      limit: safeLimit,
      search,
      searchInContent,
      sort,
      dir,
      books,
      topicIds,
      sageIds,
    });

    const nextOffset = offset + items.length;
    const nextCursor = nextOffset < total ? String(nextOffset) : null;

    return apiSuccess({ items, nextCursor, total });
  } catch {
    return ApiErrors.internal();
  }
}
