import Link from 'next/link';
import { listAllMissingSources } from '@/db/missing-source-repository';

export default async function AdminMissingSourcesPage() {
  const items = await listAllMissingSources();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">מקורות מבוקשים</h1>

      {items.length === 0 ? (
        <p className="text-gray-500">לא הוזנו מקורות מבוקשים.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-600">תיאור</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">#</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">גרסה</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">משתמש</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">תאריך</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const revisionHref = item.revision.article
                  ? `/articles/${item.revision.article.slug}/revisions/${item.revision.id}`
                  : `/revisions/${item.revision.id}`;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{item.text}</td>
                    <td className="px-4 py-3 text-gray-600">[{item.citationNumber}]</td>
                    <td className="px-4 py-3">
                      <Link
                        href={revisionHref}
                        className="text-blue-600 hover:underline"
                      >
                        {item.revision.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/users/${item.createdBy.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {item.createdBy.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString('he-IL')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
