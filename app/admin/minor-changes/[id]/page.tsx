import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findMinorChangeRequestById } from '@/db/minor-change-repository';
import { findRevisionById } from '@/db/revision-repository';
import { MinorChangeActions } from '@/ui/components/admin/minor-change-actions';

export default async function AdminMinorChangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await findMinorChangeRequestById(id);
  if (!request) notFound();

  const revision = await findRevisionById(request.revisionId);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">בקשת שינוי מינורי</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-lg font-medium">{revision?.title ?? 'גרסה'}</p>
            <p className="text-sm text-gray-500">
              מבקש: {request.requestedBy.name} ·{' '}
              {new Date(request.createdAt).toLocaleDateString('he-IL')}
            </p>
            <p className="mt-1 text-xs text-gray-400">סטטוס: {request.status}</p>
          </div>
          {request.status === 'Pending' && (
            <MinorChangeActions
              revisionId={request.revisionId}
              requestId={request.id}
            />
          )}
        </div>

        <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
          <p className="text-sm text-gray-700">{request.message}</p>
        </div>

        {revision && (
          <Link
            href={
              revision.article
                ? `/articles/${revision.article.slug}/propose/${revision.id}`
                : `/revisions/${revision.id}`
            }
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            צפה בגרסה
          </Link>
        )}
      </div>
    </div>
  );
}
