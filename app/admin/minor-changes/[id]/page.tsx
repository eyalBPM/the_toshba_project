import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findMinorChangeRequestById } from '@/db/minor-change-repository';
import { findRevisionById } from '@/db/revision-repository';
import { MinorChangeActions } from '@/ui/components/admin/minor-change-actions';
import { ContentRenderer } from '@/ui/components/content-renderer';

export default async function AdminMinorChangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await findMinorChangeRequestById(id);
  if (!request) notFound();

  const revision = await findRevisionById(request.revisionId);
  const hasContentChanges = !!(request.title || request.content);

  return (
    <div className={hasContentChanges ? 'max-w-6xl' : 'max-w-2xl'}>
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

        {/* Message / explanation */}
        {request.message && (
          <div className="mb-4 rounded-md border border-gray-100 bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium text-gray-500">הסבר המבקש:</p>
            <p className="text-sm text-gray-700">{request.message}</p>
          </div>
        )}

        {/* Title diff */}
        {request.title && revision && request.title !== revision.title && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="mb-1 text-xs font-medium text-amber-700">שינוי כותרת:</p>
            <p className="text-gray-500 line-through">{revision.title}</p>
            <p className="font-medium text-gray-900">{request.title}</p>
          </div>
        )}

        {/* Side-by-side content diff */}
        {hasContentChanges && revision && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-gray-500">השוואת תוכן:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-1 text-xs font-semibold text-gray-500">גרסה נוכחית</h3>
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                  <ContentRenderer content={revision.content} />
                </div>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold text-blue-600">שינוי מוצע</h3>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                  <ContentRenderer content={request.content ?? revision.content} />
                </div>
              </div>
            </div>
          </div>
        )}

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
