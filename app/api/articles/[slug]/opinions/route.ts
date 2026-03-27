import type { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { findArticleBySlug } from '@/db/article-repository';
import { listResponsesByRevision } from '@/db/opinion-repository';
import { parsePaginationParams, toPaginated } from '@/lib/pagination';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { cursor, limit } = parsePaginationParams(new URL(request.url));
    const [article, currentUser] = await Promise.all([
      findArticleBySlug(slug),
      getCurrentUser(),
    ]);

    if (!article) return ApiErrors.notFound('Article not found');
    if (!article.currentRevisionId) return apiSuccess(toPaginated([], limit));

    const responses = await listResponsesByRevision(
      article.currentRevisionId,
      currentUser?.id ?? null,
      { cursor, limit },
    );

    return apiSuccess(toPaginated(responses, limit));
  } catch {
    return ApiErrors.internal();
  }
}
