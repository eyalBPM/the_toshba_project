import Link from 'next/link';
import { listPendingRevisions } from '@/db/revision-repository';
import { StatusBadge } from '@/ui/components/status-badge';

export default async function AdminRevisionsPage() {
  const revisions = await listPendingRevisions();

  function getViewHref(rev: (typeof revisions)[0]) {
    if (rev.article) {
      return `/articles/${rev.article.slug}/propose/${rev.id}`;
    }
    return `/revisions/${rev.id}`;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">גרסאות ממתינות</h1>

      {revisions.length === 0 ? (
        <p className="text-gray-500">אין גרסאות ממתינות.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">כותרת</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">מאת</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">ערך</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">תאריך</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {revisions.map((rev) => (
                <tr key={rev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={getViewHref(rev)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {rev.title || '(ללא שם)'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{rev.createdBy.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {rev.article?.title ?? 'ערך חדש'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(rev.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge type="requestStatus" value={rev.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
