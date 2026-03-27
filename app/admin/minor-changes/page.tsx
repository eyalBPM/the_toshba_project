import Link from 'next/link';
import { listPendingMinorChangeRequests } from '@/db/minor-change-repository';
import { findRevisionById } from '@/db/revision-repository';
import { MinorChangeActions } from '@/ui/components/admin/minor-change-actions';

export default async function AdminMinorChangesPage() {
  const requests = await listPendingMinorChangeRequests();

  // Fetch revision titles for display
  const revisionIds = [...new Set(requests.map((r) => r.revisionId))];
  const revisions = await Promise.all(revisionIds.map((id) => findRevisionById(id)));
  const revisionMap = new Map(
    revisions.filter(Boolean).map((r) => [r!.id, r!]),
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">בקשות שינוי מינורי</h1>

      {requests.length === 0 ? (
        <p className="text-gray-500">אין בקשות ממתינות.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const revision = revisionMap.get(req.revisionId);
            return (
              <div
                key={req.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {revision?.title ?? 'גרסה'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {req.requestedBy.name} ·{' '}
                      {new Date(req.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <MinorChangeActions
                    revisionId={req.revisionId}
                    requestId={req.id}
                  />
                </div>
                <p className="text-sm text-gray-600">{req.message}</p>
                {revision && (
                  <Link
                    href={
                      revision.article
                        ? `/articles/${revision.article.slug}/propose/${revision.id}`
                        : `/revisions/${revision.id}`
                    }
                    className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                  >
                    צפה בגרסה
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
