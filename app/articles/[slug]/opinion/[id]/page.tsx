import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findResponseById } from '@/db/opinion-repository';
import { findArticleById } from '@/db/article-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { canViewOpinionResponse } from '@/application/opinion/can-view-response';
import { ContentRenderer } from '@/ui/components/content-renderer';
import { OpinionViewActions } from '@/ui/components/opinion-view-actions';
import { formatHebrewDate } from '@/lib/hebrew-dates';

export default async function OpinionViewPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const [response, currentUser] = await Promise.all([
    findResponseById(id),
    getCurrentUser(),
  ]);

  if (!response) notFound();

  const allowed = await canViewOpinionResponse(response, currentUser?.id ?? null);
  if (!allowed) notFound();

  const article = await findArticleById(response.articleId);
  const isStale =
    !!article?.currentRevisionId &&
    response.savedAtRevisionId !== article.currentRevisionId;

  const isOwner = currentUser?.id === response.userId;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">חוות דעת</h1>
          <p className="text-sm text-gray-500">
            {response.user.name} · {response.cluster.title} ·{' '}
            {formatHebrewDate(response.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/articles/${slug}`}
            className="text-sm text-blue-600 hover:underline"
          >
            חזרה למאמר
          </Link>
          {isOwner && (
            <OpinionViewActions
              responseId={id}
              editHref={`/articles/${slug}/opinion/${id}/edit`}
              initialPublished={response.published}
              clusterVisibility={
                response.cluster.visibility as 'Private' | 'Shared' | 'Public'
              }
            />
          )}
        </div>
      </div>

      {isOwner && !response.published && (
        <div className="mb-3 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          טיוטה — חוות הדעת עדיין לא פורסמה ורק את/ה רואה אותה. כדי שהקהילה תראה
          אותה, לחץ/י על &quot;פרסם&quot;.
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <ContentRenderer content={response.content} />
      </div>

      {isStale && (
        <p className="mt-3 text-xs text-gray-400">
          נכתב עבור{' '}
          <Link
            href={`/revisions/${response.savedAtRevisionId}`}
            className="underline hover:text-gray-600"
          >
            מהדורה ישנה
          </Link>
        </p>
      )}
    </main>
  );
}
