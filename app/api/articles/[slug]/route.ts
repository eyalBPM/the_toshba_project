import type { NextRequest } from 'next/server';
import { findArticleBySlug } from '@/db/article-repository';
import { listPendingRevisionsByArticle } from '@/db/revision-repository';
import { apiSuccess, ApiErrors } from '@/lib/api-error';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const article = await findArticleBySlug(slug);
    if (!article) return ApiErrors.notFound('Article not found');

    const pendingRevisions = await listPendingRevisionsByArticle(article.id);

    return apiSuccess({ article, pendingRevisions });
  } catch {
    return ApiErrors.internal();
  }
}
