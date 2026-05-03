import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findArticleBySlug } from '@/db/article-repository';
import {
  listPendingRevisionsByArticle,
  findRevisionById,
  findActiveRevisionByArticleAndUser,
} from '@/db/revision-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { ContentRenderer } from '@/ui/components/content-renderer';
import { StatusBadge } from '@/ui/components/status-badge';
import { ProposeRevisionButton } from './propose-revision-button';
import { OpinionList } from '@/ui/components/opinion-list';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, currentUser] = await Promise.all([
    findArticleBySlug(slug),
    getCurrentUser(),
  ]);

  if (!article) notFound();

  const [currentRevision, pendingRevisions, existingActiveRevision] = await Promise.all([
    article.currentRevisionId ? findRevisionById(article.currentRevisionId) : null,
    listPendingRevisionsByArticle(article.id),
    currentUser
      ? findActiveRevisionByArticleAndUser(article.id, currentUser.id)
      : Promise.resolve(null),
  ]);

  const snap = article.snapshot;
  const topics = Array.isArray(snap?.topicsSnapshot)
    ? (snap.topicsSnapshot as Array<{ text: string }>)
    : [];
  const sages = Array.isArray(snap?.sagesSnapshot)
    ? (snap.sagesSnapshot as Array<{ text: string }>)
    : [];

  const isVerified = currentUser?.status === 'VerifiedUser';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex gap-6" dir="rtl">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Article header */}
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold">{article.title}</h1>
            {topics.length > 0 && (
              <p className="mb-1 text-sm text-gray-600">
                נושאים: {topics.map((t) => t.text).join(', ')}
              </p>
            )}
            {sages.length > 0 && (
              <p className="mb-1 text-sm text-gray-600">
                חכמים: {sages.map((s) => s.text).join(', ')}
              </p>
            )}
            <div className="mt-3 flex gap-3">
              <Link
                href={`/articles/${slug}/revisions`}
                className="text-sm text-blue-600 hover:underline"
              >
                היסטוריית גרסאות
              </Link>
              {isVerified && (
                <ProposeRevisionButton
                  articleId={article.id}
                  slug={slug}
                  existingActiveRevisionId={existingActiveRevision?.id ?? null}
                />
              )}
            </div>
          </div>

          {/* Article content */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {currentRevision ? (
              <ContentRenderer content={currentRevision.content} />
            ) : (
              <p className="text-gray-400">אין תוכן עדיין.</p>
            )}
          </div>

          {/* Pending revisions */}
          {pendingRevisions.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">הצעות עדכון ממתינות</h2>
              <ul className="space-y-2">
                {pendingRevisions.map((rev) => (
                  <li
                    key={rev.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3"
                  >
                    <div>
                      <Link
                        href={`/articles/${slug}/propose/${rev.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {rev.title}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {rev.createdBy.name} ·{' '}
                        {new Date(rev.createdAt).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="requestStatus" value={rev.status} />
                      {currentUser?.id === rev.createdByUserId && (
                        <Link
                          href={`/articles/${slug}/propose/${rev.id}/edit`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          ערוך
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Opinion list sidebar */}
        <aside className="w-72 shrink-0">
          <OpinionList
            slug={slug}
            currentUserId={currentUser?.id ?? null}
            isVerified={isVerified}
            currentRevisionId={article.currentRevisionId ?? null}
          />
        </aside>
      </div>
    </main>
  );
}
