import type { DomainUser } from '@/domain/types';
import { canCreateRevision } from '@/domain/permissions/rules';
import {
  createRevisionWithSnapshot,
  findActiveRevisionByArticleAndUser,
  findRevisionById,
  type SnapshotInput,
} from '@/db/revision-repository';
import { findArticleById } from '@/db/article-repository';

export interface CreateRevisionInput {
  user: DomainUser;
  title?: string;
  articleId?: string;
}

export interface CreateRevisionResult {
  revisionId: string;
}

export class ActiveRevisionAlreadyExistsError extends Error {
  readonly code = 'ACTIVE_REVISION_ALREADY_EXISTS' as const;
  constructor(public readonly existingRevisionId: string) {
    super('User already has an active revision for this article');
  }
}

export async function createRevision(
  input: CreateRevisionInput,
): Promise<CreateRevisionResult> {
  if (!canCreateRevision(input.user.status)) {
    throw new Error('Only verified users can create revisions');
  }

  let title = input.title;
  let content: unknown = undefined;
  let snapshot: SnapshotInput | undefined = undefined;

  if (input.articleId) {
    const existing = await findActiveRevisionByArticleAndUser(
      input.articleId,
      input.user.id,
    );
    if (existing) {
      throw new ActiveRevisionAlreadyExistsError(existing.id);
    }

    const article = await findArticleById(input.articleId);
    if (!article) throw new Error('Article not found');

    const currentRevision = article.currentRevisionId
      ? await findRevisionById(article.currentRevisionId)
      : null;
    if (currentRevision) {
      title = currentRevision.title;
      content = currentRevision.content;
      snapshot = {
        sourcesSnapshot: currentRevision.snapshot.sourcesSnapshot,
        topicsSnapshot: currentRevision.snapshot.topicsSnapshot,
        sagesSnapshot: currentRevision.snapshot.sagesSnapshot,
        referencesSnapshot: currentRevision.snapshot.referencesSnapshot,
        contentLength: currentRevision.snapshot.contentLength,
      };
    }
  }

  if (!title) throw new Error('Title is required');

  const revision = await createRevisionWithSnapshot({
    title,
    content,
    createdByUserId: input.user.id,
    articleId: input.articleId,
    snapshot,
  });

  return { revisionId: revision.id };
}
