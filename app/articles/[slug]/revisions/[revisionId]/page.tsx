import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findRevisionById } from '@/db/revision-repository';
import { findArticleBySlug } from '@/db/article-repository';
import { ContentRenderer } from '@/ui/components/content-renderer';
import { StatusBadge } from '@/ui/components/status-badge';

export default async function HistoricalRevisionPage({
  params,
}: {
  params: Promise<{ slug: string; revisionId: string }>;
}) {
  const { slug, revisionId } = await params;
  const [article, revision] = await Promise.all([
    findArticleBySlug(slug),
    findRevisionById(revisionId),
  ]);

  if (!article || !revision) notFound();
  if (revision.articleId !== article.id) notFound();

  const topics = Array.isArray(revision.snapshot.topicsSnapshot)
    ? (revision.snapshot.topicsSnapshot as Array<{ text: string }>)
    : [];
  const sages = Array.isArray(revision.snapshot.sagesSnapshot)
    ? (revision.snapshot.sagesSnapshot as Array<{ text: string }>)
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
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
        {new Date(revision.createdAt).toLocaleDateString('he-IL')}
      </p>

      {(topics.length > 0 || sages.length > 0) && (
        <div className="mb-4 text-sm text-gray-600">
          {topics.length > 0 && <p>נושאים: {topics.map((t) => t.text).join(', ')}</p>}
          {sages.length > 0 && <p>חכמים: {sages.map((s) => s.text).join(', ')}</p>}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <ContentRenderer content={revision.content} />
      </div>
    </main>
  );
}
