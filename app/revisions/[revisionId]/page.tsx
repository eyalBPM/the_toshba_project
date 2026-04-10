import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { findRevisionById } from '@/db/revision-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { ContentRenderer } from '@/ui/components/content-renderer';
import { StatusBadge } from '@/ui/components/status-badge';
import { AgreementButton } from '@/ui/components/agreement-button';
import { RevisionActions } from '@/ui/components/revision-actions';
import { MinorChangeRequestForm } from '@/ui/components/minor-change-request-form';
import { MinorChangeStatus } from '@/ui/components/minor-change-status';
import { MinorChangeReview } from '@/ui/components/minor-change-review';
import { RevisionImages } from '@/ui/components/revision-images';
import { EditRevisionButton } from '@/ui/components/edit-revision-button';

export default async function RevisionFallbackPage({
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

  // If the revision is linked to an article, redirect to the article's propose page
  if (revision.article) {
    redirect(`/articles/${revision.article.slug}/propose/${revisionId}`);
  }

  const isOwner = currentUser?.id === revision.createdByUserId;
  const canEdit = isOwner && (revision.status === 'Draft' || revision.status === 'Pending');

  const topics = Array.isArray(revision.snapshot.topicsSnapshot)
    ? (revision.snapshot.topicsSnapshot as Array<{ text: string }>)
    : [];
  const sages = Array.isArray(revision.snapshot.sagesSnapshot)
    ? (revision.snapshot.sagesSnapshot as Array<{ text: string }>)
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{revision.title || '(ללא שם)'}</h1>
        <div className="flex items-center gap-3">
          <StatusBadge type="requestStatus" value={revision.status} />
          {canEdit && (
            <EditRevisionButton
              revisionId={revisionId}
              editUrl={`/revisions/${revisionId}/edit`}
            />
          )}
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        {revision.createdBy.name} ·{' '}
        {new Date(revision.createdAt).toLocaleDateString('he-IL')}
      </p>

      {revision.status === 'Obsolete' && (
        <div className="mb-4 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700" dir="rtl">
          גרסה זו הפכה למיושנת כיוון שגרסה מתחרה אושרה. לא ניתן לערוך אותה.
        </div>
      )}

      {(topics.length > 0 || sages.length > 0) && (
        <div className="mb-4 text-sm text-gray-600">
          {topics.length > 0 && <p>נושאים: {topics.map((t) => t.text).join(', ')}</p>}
          {sages.length > 0 && <p>חכמים: {sages.map((s) => s.text).join(', ')}</p>}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <ContentRenderer content={revision.content} />
      </div>

      <div className="mt-4">
        <RevisionImages
          revisionId={revisionId}
          currentUserId={currentUser?.id ?? null}
        />
      </div>

      {revision.status === 'Pending' && (
        <div className="mt-6 space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
          <AgreementButton
            revisionId={revisionId}
            currentUserId={currentUser?.id ?? null}
            isOwner={isOwner}
            revisionStatus={revision.status}
          />
          {isOwner && <MinorChangeStatus revisionId={revisionId} />}
          {currentUser?.role && (
            <>
              <RevisionActions
                revisionId={revisionId}
                userRole={currentUser.role}
                revisionStatus={revision.status}
              />
              <MinorChangeReview
                revisionId={revisionId}
                userRole={currentUser.role}
              />
            </>
          )}
          {isOwner && <MinorChangeRequestForm revisionId={revisionId} />}
        </div>
      )}
    </main>
  );
}
