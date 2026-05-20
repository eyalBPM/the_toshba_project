import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findRevisionById } from '@/db/revision-repository';
import { findArticleBySlug } from '@/db/article-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { getImageStatusMap } from '@/lib/image-status-map';
import { ContentRenderer } from '@/ui/components/content-renderer';
import { StatusBadge } from '@/ui/components/status-badge';
import { ContentSidebar } from '@/ui/components/tiptap-editor/content-sidebar';
import { formatHebrewDate } from '@/lib/hebrew-dates';

export default async function HistoricalRevisionPage({
  params,
}: {
  params: Promise<{ slug: string; revisionId: string }>;
}) {
  const { slug, revisionId } = await params;
  const [article, revision, currentUser] = await Promise.all([
    findArticleBySlug(slug),
    findRevisionById(revisionId),
    getCurrentUser(),
  ]);

  if (!article || !revision) notFound();
  if (revision.articleId !== article.id) notFound();

  // Draft revisions are private to their owner
  if (revision.status === 'Draft' && currentUser?.id !== revision.createdByUserId) {
    notFound();
  }

  const isOwner = currentUser?.id === revision.createdByUserId;
  const imageStatuses = await getImageStatusMap(revision.id);

  const topics = Array.isArray(revision.snapshot.topicsSnapshot)
    ? (revision.snapshot.topicsSnapshot as Array<{ text: string }>)
    : [];
  const sages = Array.isArray(revision.snapshot.sagesSnapshot)
    ? (revision.snapshot.sagesSnapshot as Array<{ text: string }>)
    : [];

  return (
    <main className="px-4 py-8" dir="rtl">
      {/* Header — full width above the flex layout */}
      <p className="mb-4 text-sm text-gray-500">
        <Link href={`/articles/${slug}/revisions`} className="text-blue-600 hover:underline">
          ← היסטוריית גרסאות
        </Link>
      </p>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{revision.title}</h1>
        <StatusBadge type="requestStatus" value={revision.status} />
      </div>

      <p className="mb-4 text-sm text-gray-500">
        {revision.createdBy.name} ·{' '}
        {formatHebrewDate(revision.createdAt)}
      </p>

      {(topics.length > 0 || sages.length > 0) && (
        <div className="mb-4 text-sm text-gray-600">
          {topics.length > 0 && <p>נושאים: {topics.map((t) => t.text).join(', ')}</p>}
          {sages.length > 0 && <p>חכמים: {sages.map((s) => s.text).join(', ')}</p>}
        </div>
      )}

      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <ContentRenderer
              content={revision.content}
              isOwner={isOwner}
              imageStatuses={imageStatuses}
            />
          </div>
        </div>

        <aside className="w-44 shrink-0">
          <ContentSidebar
            readOnly
            snapshot={revision.snapshot}
            content={revision.content}
          />
        </aside>
      </div>
    </main>
  );
}
