import { notFound, redirect } from 'next/navigation';
import { findRevisionById } from '@/db/revision-repository';
import { findArticleBySlug } from '@/db/article-repository';
import { countAgreementsByRevision } from '@/db/agreement-repository';
import { findMinorChangeRequestById } from '@/db/minor-change-repository';
import { getCurrentUser } from '@/lib/auth-utils';
import { RevisionEditor } from '@/ui/components/revision-editor';
import type { EditorMode } from '@/ui/components/revision-editor';

export default async function EditLinkedRevisionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; revisionId: string }>;
  searchParams: Promise<{ mode?: string; mcrId?: string }>;
}) {
  const { slug, revisionId } = await params;
  const { mode, mcrId } = await searchParams;
  const [article, revision, currentUser] = await Promise.all([
    findArticleBySlug(slug),
    findRevisionById(revisionId),
    getCurrentUser(),
  ]);

  if (!article || !revision) notFound();
  if (revision.articleId !== article.id) notFound();

  if (!currentUser) redirect(`/login?callbackUrl=/articles/${slug}/propose/${revisionId}/edit`);
  if (currentUser.id !== revision.createdByUserId) notFound();

  const topics = Array.isArray(revision.snapshot.topicsSnapshot)
    ? (revision.snapshot.topicsSnapshot as Array<{ id: string; text: string }>)
    : [];
  const sages = Array.isArray(revision.snapshot.sagesSnapshot)
    ? (revision.snapshot.sagesSnapshot as Array<{ id: string; text: string }>)
    : [];

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">
        {editorMode === 'mcr' ? 'בקשה לשינוי מינורי' : 'עריכת הצעת עדכון'}
      </h1>
      <RevisionEditor
        revisionId={revisionId}
        initialTitle={revision.title}
        initialContent={revision.content}
        initialTopics={topics}
        initialSages={sages}
        status={revision.status}
        agreementCount={agreementCount}
        deleteRedirectUrl={`/articles/${slug}`}
        viewUrl={`/articles/${slug}/propose/${revisionId}`}
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
