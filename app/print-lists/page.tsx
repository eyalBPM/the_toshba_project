import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-utils';
import { listPrintListsByUser } from '@/db/print-list-repository';

export default async function PrintListsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?callbackUrl=/print-lists');

  const lists = await listPrintListsByUser(currentUser.id);

  async function handleCreate() {
    'use server';
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/print-lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: {} }),
    });
    if (res.ok) {
      const json = await res.json();
      redirect(`/print-lists/${json.data.id}`);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">רשימות הדפסה</h1>
      </div>

      {lists.length === 0 ? (
        <p className="text-gray-500">אין רשימות הדפסה עדיין.</p>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => {
            const settings = list.settings as {
              articleIds?: string[];
            } | null;
            const articleCount = settings?.articleIds?.length ?? 0;

            return (
              <div
                key={list.id}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3"
              >
                <div>
                  <Link
                    href={`/print-lists/${list.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    רשימת הדפסה
                  </Link>
                  <p className="text-xs text-gray-500">
                    {articleCount} ערכים ·{' '}
                    {new Date(list.createdAt).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/print-lists/${list.id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    ערוך
                  </Link>
                  <Link
                    href={`/print-lists/${list.id}/print`}
                    target="_blank"
                    className="text-xs text-gray-600 hover:underline"
                  >
                    הדפס
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form action={handleCreate} className="mt-4">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          רשימה חדשה
        </button>
      </form>
    </main>
  );
}
