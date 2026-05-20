import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { findRevisionById } from '@/db/revision-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { getImageStatusMap } from '@/lib/image-status-map';
import { ContentRenderer } from '@/ui/components/content-renderer';
import { StatusBadge } from '@/ui/components/status-badge';
import { AgreementButton } from '@/ui/components/agreement-button';
import { RevisionActions } from '@/ui/components/revision-actions';
import { MinorChangeRequestForm } from '@/ui/components/minor-change-request-form';
import { MinorChangeStatus } from '@/ui/components/minor-change-status';
import { findPendingRequestByRevision } from '@/db/minor-change-repository';
import { MinorChangeReview } from '@/ui/components/minor-change-review';
import { RevisionImages } from '@/ui/components/revision-images';
import { EditRevisionButton } from '@/ui/components/edit-revision-button';
import { ContentSidebar } from '@/ui/components/tiptap-editor/content-sidebar';
import { formatHebrewDate } from '@/lib/hebrew-dates';

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

  const isOwner = currentUser?.id === revision.createdByUserId;

  // Draft revisions are private to their owner
  if (revision.status === 'Draft' && !isOwner) notFound();

  // If the revision is linked to an article, redirect to the article's propose page
  if (revision.article) {
    redirect(`/articles/${revision.article.slug}/propose/${revisionId}`);
  }

  const canEdit = isOwner && (revision.status === 'Draft' || revision.status === 'Pending');
  const pendingMcr = isOwner && revision.status === 'Pending'
    ? await findPendingRequestByRevision(revisionId)
    : null;

  const imageStatuses = await getImageStatusMap(revisionId);

  const topics = Array.isArray(revision.snapshot.topicsSnapshot)
    ? (revision.snapshot.topicsSnapshot as Array<{ text: string }>)
    : [];
  const sages = Array.isArray(revision.snapshot.sagesSnapshot)
    ? (revision.snapshot.sagesSnapshot as Array<{ text: string }>)
    : [];

  return (
    <main className="px-4 py-8" dir="rtl">
      {/* Header — full width above the flex layout */}
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
        {formatHebrewDate(revision.createdAt)}
      </p>

      {revision.status === 'Obsolete' && (
        <div className="mb-4 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          גרסה זו הפכה למיושנת כיוון שגרסה מתחרה אושרה. לא ניתן לערוך אותה.
        </div>
      )}

      {(topics.length > 0 || sages.length > 0) && (
        <div className="mb-4 text-sm text-gray-600">
          {topics.length > 0 && <p>נושאים: {topics.map((t) => t.text).join(', ')}</p>}
          {sages.length > 0 && <p>חכמים: {sages.map((s) => s.text).join(', ')}</p>}
        </div>
      )}

      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <ContentRenderer
              content={revision.content}
              isOwner={isOwner}
              imageStatuses={imageStatuses}
            />
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
              {isOwner && (
                <MinorChangeRequestForm
                  editUrl={`/revisions/${revisionId}/edit`}
                  pendingMcrId={pendingMcr?.id}
                />
              )}
            </div>
          )}
        </div>

        {/* Entity sidebar (sources, topics, references, sages) */}
        <aside className="w-44 shrink-0">
          <ContentSidebar
            readOnly
            snapshot={revision.snapshot}
            content={revision.content}
          />
        </aside>
      </div>
    </main>
  );
}
