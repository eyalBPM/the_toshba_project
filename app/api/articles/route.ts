import type { NextRequest } from 'next/server';
import { listArticles } from '@/db/article-repository';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { parsePaginationParams, toPaginated } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const { cursor, limit } = parsePaginationParams(url);
    const search = url.searchParams.get('search') ?? undefined;
    const articles = await listArticles({ cursor, limit, search });
    return apiSuccess(toPaginated(articles, limit));
  } catch {
    return ApiErrors.internal();
  }
}
