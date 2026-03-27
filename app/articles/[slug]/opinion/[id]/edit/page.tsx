import { notFound, redirect } from 'next/navigation';
import { findResponseById } from '@/db/opinion-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { OpinionEditor } from '@/ui/components/opinion-editor';

export default async function EditOpinionPage({
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
  if (!currentUser) redirect(`/login?callbackUrl=/articles/${slug}/opinion/${id}/edit`);
  if (currentUser.id !== response.userId) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">עריכת חוות דעת</h1>
      <OpinionEditor
        responseId={id}
        initialContent={response.content}
        deleteRedirectUrl={`/articles/${slug}`}
      />
    </main>
  );
}
