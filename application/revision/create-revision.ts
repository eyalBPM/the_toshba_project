import type { DomainUser } from '@/domain/types';
import { canCreateRevision } from '@/domain/permissions/rules';
import {
  createRevisionWithSnapshot,
  findActiveRevisionByArticleAndUser,
} from '@/db/revision-repository';

export interface CreateRevisionInput {
  user: DomainUser;
  title: string;
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

  if (input.articleId) {
    const existing = await findActiveRevisionByArticleAndUser(
      input.articleId,
      input.user.id,
    );
    if (existing) {
      throw new ActiveRevisionAlreadyExistsError(existing.id);
    }
  }

  const revision = await createRevisionWithSnapshot({
    title: input.title,
    createdByUserId: input.user.id,
    articleId: input.articleId,
  });

  return { revisionId: revision.id };
}
