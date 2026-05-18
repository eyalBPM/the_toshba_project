import { notFound, redirect } from 'next/navigation';
import { findRevisionById } from '@/db/revision-repository';
import { countAgreementsByRevision } from '@/db/agreement-repository';
import { findMinorChangeRequestById, findPendingRequestByRevision } from '@/db/minor-change-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import {
  deriveAbstractTopics,
  deriveAbstractSages,
  deriveAbstractSources,
  deriveAbstractReferences,
} from '@/lib/derive-abstract-entries';
import { RevisionEditor } from '@/ui/components/revision-editor';
import type { EditorMode } from '@/ui/components/revision-editor';

export default async function EditRevisionPage({
  params,
  searchParams,
}: {
  params: Promise<{ revisionId: string }>;
  searchParams: Promise<{ mode?: string; mcrId?: string }>;
}) {
  const { revisionId } = await params;
  const { mode, mcrId } = await searchParams;
  const [revision, currentUser] = await Promise.all([
    findRevisionById(revisionId),
    getCurrentUser(),
  ]);

  if (!revision) notFound();
  if (!currentUser) redirect(`/login?callbackUrl=/revisions/${revisionId}/edit`);
  if (currentUser.id !== revision.createdByUserId) notFound();

  // If linked to article, redirect to article-scoped edit
  if (revision.article) {
    const mcrParams = mode === 'mcr' ? `?mode=mcr${mcrId ? `&mcrId=${mcrId}` : ''}` : '';
    redirect(`/articles/${revision.article.slug}/propose/${revisionId}/edit${mcrParams}`);
  }

  if (revision.status !== 'Draft' && revision.status !== 'Pending') {
    redirect(`/revisions/${revisionId}`);
  }

  const initialAbstractTopics = deriveAbstractTopics(
    revision.snapshot.topicsSnapshot,
    revision.content,
  );
  const initialAbstractSages = deriveAbstractSages(
    revision.snapshot.sagesSnapshot,
    revision.content,
  );
  const initialAbstractSources = deriveAbstractSources(
    revision.snapshot.sourcesSnapshot,
    revision.content,
  );
  const initialAbstractReferences = deriveAbstractReferences(
    revision.snapshot.referencesSnapshot,
    revision.content,
  );

  const agreementCount = await countAgreementsByRevision(revisionId);

  // MCR mode: fetch existing MCR data if editing
  const editorMode: EditorMode = mode === 'mcr' ? 'mcr' : 'normal';
  let mcrData: { id: string; title: string | null; content: unknown; snapshotData: unknown; message: string | null } | null = null;
  if (editorMode === 'mcr' && mcrId) {
    const existingMcr = await findMinorChangeRequestById(mcrId);
    if (existingMcr && existingMcr.status === 'Pending') {
      mcrData = { id: existingMcr.id, title: existingMcr.title, content: existingMcr.content, snapshotData: existingMcr.snapshotData, message: existingMcr.message };
    }
  }

  return (
    <main className="px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">
        {editorMode === 'mcr' ? 'בקשה לשינוי מינורי' : 'עריכת טיוטה'}
      </h1>
      <RevisionEditor
        revisionId={revisionId}
        initialTitle={revision.title}
        initialContent={revision.content}
        initialAbstractTopics={initialAbstractTopics}
        initialAbstractSages={initialAbstractSages}
        initialAbstractSources={initialAbstractSources}
        initialAbstractReferences={initialAbstractReferences}
        status={revision.status}
        agreementCount={agreementCount}
        deleteRedirectUrl="/articles"
        viewUrl={`/revisions/${revisionId}`}
        editorMode={editorMode}
        mcrId={mcrData?.id}
        mcrTitle={mcrData?.title ?? undefined}
        mcrContent={mcrData?.content ?? undefined}
        mcrSnapshotData={mcrData?.snapshotData ?? undefined}
        mcrMessage={mcrData?.message ?? undefined}
      />
    </main>
  );
}
