import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findResponseById } from '@/db/opinion-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { ContentRenderer } from '@/ui/components/content-renderer';

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

  const isOwner = currentUser?.id === response.userId;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">חוות דעת</h1>
          <p className="text-sm text-gray-500">
            {response.user.name} · {response.cluster.title} ·{' '}
            {new Date(response.createdAt).toLocaleDateString('he-IL')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/articles/${slug}`}
            className="text-sm text-blue-600 hover:underline"
          >
            חזרה לערך
          </Link>
          {isOwner && (
            <Link
              href={`/articles/${slug}/opinion/${id}/edit`}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              ערוך
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <ContentRenderer content={response.content} />
      </div>
    </main>
  );
}
