import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findRevisionById } from '@/db/revision-repository';
import { findArticleBySlug } from '@/db/article-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { getImageStatusMap } from '@/lib/image-status-map';
import { ContentRenderer } from '@/ui/components/content-renderer';
import { StatusBadge } from '@/ui/components/status-badge';
import { AgreementButton } from '@/ui/components/agreement-button';
import { RevisionActions } from '@/ui/components/revision-actions';
import { MinorChangeRequestForm } from '@/ui/components/minor-change-request-form';
import { findPendingRequestByRevision } from '@/db/minor-change-repository';
import { MinorChangeStatus } from '@/ui/components/minor-change-status';
import { MinorChangeReview } from '@/ui/components/minor-change-review';
import { EditRevisionButton } from '@/ui/components/edit-revision-button';
import { ContentSidebar } from '@/ui/components/tiptap-editor/content-sidebar';
import { formatHebrewDate } from '@/lib/hebrew-dates';

export default async function ProposedRevisionPage({
  params,
}: {
  params: Promise<{ slug: string; revisionId: string }>;
}) {
  const { slug, revisionId } = await params;

  const [article, revision, currentUser] = await Promise.all([
    findArticleBySlug(slug),
    findRevisionById(revisionId),
    getCurrentUser(),
  ]);

  if (!article || !revision) notFound();
  if (revision.articleId !== article.id) notFound();

  const isOwner = currentUser?.id === revision.createdByUserId;

  // Draft revisions are private to their owner
  if (revision.status === 'Draft' && !isOwner) notFound();

  const currentRevision = article.currentRevisionId
    ? await findRevisionById(article.currentRevisionId)
    : null;
  const pendingMcr = isOwner && revision.status === 'Pending'
    ? await findPendingRequestByRevision(revisionId)
    : null;

  const proposedImageStatuses = await getImageStatusMap(revision.id);
  const currentImageStatuses = currentRevision
    ? await getImageStatusMap(currentRevision.id)
    : {};
  const isOwnerOfCurrent =
    !!currentRevision && currentUser?.id === currentRevision.createdByUserId;

  const proposedTopics = Array.isArray(revision.snapshot.topicsSnapshot)
    ? (revision.snapshot.topicsSnapshot as Array<{ text: string }>)
    : [];
  const currentTopics = currentRevision
    ? Array.isArray(currentRevision.snapshot.topicsSnapshot)
      ? (currentRevision.snapshot.topicsSnapshot as Array<{ text: string }>)
      : []
    : [];

  return (
    <main className="px-4 py-8" dir="rtl">
      <div className="mb-4">
        <Link
          href={`/articles/${slug}`}
          className="text-sm text-blue-600 hover:underline"
        >
          חזרה למאמר
        </Link>
      </div>
      {/* Header — full width above the flex layout */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{revision.title}</h1>
          <p className="text-sm text-gray-500">
            הוצע על ידי {revision.createdBy.name} ·{' '}
            {formatHebrewDate(revision.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge type="requestStatus" value={revision.status} />
          {isOwner && (revision.status === 'Draft' || revision.status === 'Pending') && (
            <EditRevisionButton
              revisionId={revisionId}
              editUrl={`/articles/${slug}/propose/${revisionId}/edit`}
            />
          )}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          {/* Metadata diff */}
          {(proposedTopics.length > 0 || currentTopics.length > 0) && (
            <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
              {proposedTopics.length > 0 && (
                <p>
                  <span className="font-medium">נושאים מוצעים: </span>
                  {proposedTopics.map((t) => t.text).join(', ')}
                </p>
              )}
              {currentTopics.length > 0 && (
                <p>
                  <span className="font-medium">נושאים נוכחיים: </span>
                  {currentTopics.map((t) => t.text).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Title diff */}
          {currentRevision && currentRevision.title !== revision.title && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-amber-700">שינוי כותרת:</p>
              <p className="text-gray-500 line-through">{currentRevision.title}</p>
              <p className="font-medium text-gray-900">{revision.title}</p>
            </div>
          )}

          {/* Side-by-side content */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-500">גרסה נוכחית</h2>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                {currentRevision ? (
                  <>
                    <h3 className="mb-2 text-base font-semibold">{currentRevision.title}</h3>
                    <ContentRenderer
                      content={currentRevision.content}
                      isOwner={isOwnerOfCurrent}
                      imageStatuses={currentImageStatuses}
                    />
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">אין גרסה מאושרת</p>
                )}
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-blue-600">גרסה מוצעת</h2>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 text-base font-semibold">{revision.title}</h3>
                <ContentRenderer
                  content={revision.content}
                  isOwner={isOwner}
                  imageStatuses={proposedImageStatuses}
                />
              </div>
            </div>
          </div>

          {/* Agreements & Admin/Senior actions */}
          <div className="mt-6 space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <AgreementButton
              revisionId={revisionId}
              currentUserId={currentUser?.id ?? null}
              isOwner={isOwner}
              revisionStatus={revision.status}
            />
            {isOwner && revision.status === 'Pending' && (
              <MinorChangeStatus revisionId={revisionId} />
            )}
            {currentUser?.role && (
              <>
                <RevisionActions
                  revisionId={revisionId}
                  userRole={currentUser.role}
                  revisionStatus={revision.status}
                />
                {revision.status === 'Pending' && (
                  <MinorChangeReview
                    revisionId={revisionId}
                    userRole={currentUser.role}
                  />
                )}
              </>
            )}
            {isOwner && revision.status === 'Pending' && (
              <MinorChangeRequestForm
                editUrl={`/articles/${slug}/propose/${revisionId}/edit`}
                pendingMcrId={pendingMcr?.id}
              />
            )}
          </div>
        </div>

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
