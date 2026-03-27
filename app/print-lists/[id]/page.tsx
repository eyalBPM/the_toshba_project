import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { findPrintListById } from '@/db/print-list-repository';
import { PrintListForm } from '@/ui/components/print-list-form';

export default async function EditPrintListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [currentUser, list] = await Promise.all([
    getCurrentUser(),
    findPrintListById(id),
  ]);

  if (!currentUser) redirect(`/login?callbackUrl=/print-lists/${id}`);
  if (!list) notFound();
  if (list.userId !== currentUser.id) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">עריכת רשימת הדפסה</h1>
      <PrintListForm
        printListId={id}
        initialSettings={(list.settings as Record<string, unknown>) ?? {}}
      />
    </main>
  );
}
