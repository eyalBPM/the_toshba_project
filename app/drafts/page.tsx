import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-utils';
import { listRevisionsByUser, listPendingRevisions } from '@/db/revision-repository';
import { StatusBadge } from '@/ui/components/status-badge';

export default async function DraftsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?callbackUrl=/drafts');

  const [myRevisions, allPending] = await Promise.all([
    listRevisionsByUser(currentUser.id, { includePending: false }),
    listPendingRevisions(),
  ]);

  // Merge: own drafts + all pending (without duplicating own pending)
  const myIds = new Set(myRevisions.map((r) => r.id));
  const pendingNotMine = allPending.filter((r) => !myIds.has(r.id));
  const rows = [...myRevisions, ...pendingNotMine];

  function getEditHref(rev: (typeof rows)[0]) {
    if (rev.article) {
      return `/articles/${rev.article.slug}/propose/${rev.id}/edit`;
    }
    return `/revisions/${rev.id}/edit`;
  }

  function getViewHref(rev: (typeof rows)[0]) {
    if (rev.article) {
      return `/articles/${rev.article.slug}/propose/${rev.id}`;
    }
    return `/revisions/${rev.id}`;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">טיוטות והצעות</h1>

      {rows.length === 0 ? (
        <p className="text-gray-500">אין טיוטות או הצעות.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">כותרת</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">מאת</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">סטטוס</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">עדכון</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((rev) => {
                const isOwn = rev.createdByUserId === currentUser.id;
                return (
                  <tr key={rev.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={getViewHref(rev)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {rev.title || '(ללא שם)'}
                      </Link>
                      {rev.article && (
                        <p className="text-xs text-gray-400">ערך: {rev.article.title}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {isOwn ? 'אני' : rev.createdBy.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="requestStatus" value={rev.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(rev.updatedAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-4 py-3">
                      {isOwn && (rev.status === 'Draft' || rev.status === 'Pending') && (
                        <Link
                          href={getEditHref(rev)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          ערוך
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
