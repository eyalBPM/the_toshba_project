import { notFound, redirect } from 'next/navigation';
import { findRevisionById } from '@/db/revision-repository';
import { countAgreementsByRevision } from '@/db/agreement-repository';
import { findApprovedRequestByRevision } from '@/db/minor-change-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { RevisionEditor } from '@/ui/components/revision-editor';

export default async function EditRevisionPage({
  params,
}: {
  params: Promise<{ revisionId: string }>;
}) {
  const { revisionId } = await params;
  const [revision, currentUser] = await Promise.all([
    findRevisionById(revisionId),
    getCurrentUser(),
  ]);

  if (!revision) notFound();
  if (!currentUser) redirect(`/login?callbackUrl=/revisions/${revisionId}/edit`);
  if (currentUser.id !== revision.createdByUserId) notFound();

  // If linked to article, redirect to article-scoped edit
  if (revision.article) {
    redirect(`/articles/${revision.article.slug}/propose/${revisionId}/edit`);
  }

  if (revision.status !== 'Draft' && revision.status !== 'Pending') {
    redirect(`/revisions/${revisionId}`);
  }

  const topics = Array.isArray(revision.snapshot.topicsSnapshot)
    ? (revision.snapshot.topicsSnapshot as Array<{ id: string; text: string }>)
    : [];
  const sages = Array.isArray(revision.snapshot.sagesSnapshot)
    ? (revision.snapshot.sagesSnapshot as Array<{ id: string; text: string }>)
    : [];

  const [agreementCount, approvedMinorChange] = await Promise.all([
    countAgreementsByRevision(revisionId),
    findApprovedRequestByRevision(revisionId),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">עריכת טיוטה</h1>
      {approvedMinorChange && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" dir="rtl">
          שינוי מינורי אושר — העריכה לא תאפס את ההסכמות
        </div>
      )}
      <RevisionEditor
        revisionId={revisionId}
        initialTitle={revision.title}
        initialContent={revision.content}
        initialTopics={topics}
        initialSages={sages}
        status={revision.status}
        agreementCount={agreementCount}
        hasApprovedMinorChange={!!approvedMinorChange}
        deleteRedirectUrl="/articles"
      />
    </main>
  );
}
