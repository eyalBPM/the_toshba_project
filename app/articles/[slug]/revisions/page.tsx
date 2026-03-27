import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findArticleBySlug } from '@/db/article-repository';
import { listRevisionsByArticle } from '@/db/revision-repository';
import { StatusBadge } from '@/ui/components/status-badge';

export default async function ArticleRevisionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);
  if (!article) notFound();

  const revisions = await listRevisionsByArticle(article.id);
  const approved = revisions.filter((r) => r.status === 'Approved');

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-xl font-bold">היסטוריית גרסאות</h1>
      <p className="mb-6 text-sm text-gray-500">
        <Link href={`/articles/${slug}`} className="text-blue-600 hover:underline">
          ← {article.title}
        </Link>
      </p>

      {approved.length === 0 ? (
        <p className="text-gray-500">אין גרסאות מאושרות.</p>
      ) : (
        <ul className="space-y-2">
          {approved.map((rev) => (
            <li key={rev.id}>
              <Link
                href={`/articles/${slug}/revisions/${rev.id}`}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{rev.title}</p>
                  <p className="text-xs text-gray-500">
                    {rev.createdBy.name} ·{' '}
                    {new Date(rev.createdAt).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <StatusBadge type="requestStatus" value={rev.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
