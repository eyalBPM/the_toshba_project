import type { DomainUser } from '@/domain/types';
import { canCreateRevision } from '@/domain/permissions/rules';
import { createRevisionWithSnapshot } from '@/db/revision-repository';

export interface CreateRevisionInput {
  user: DomainUser;
  title: string;
  articleId?: string;
}

export interface CreateRevisionResult {
  revisionId: string;
}

export async function createRevision(
  input: CreateRevisionInput,
): Promise<CreateRevisionResult> {
  if (!canCreateRevision(input.user.status)) {
    throw new Error('Only verified users can create revisions');
  }

  const revision = await createRevisionWithSnapshot({
    title: input.title,
    createdByUserId: input.user.id,
    articleId: input.articleId,
  });

  return { revisionId: revision.id };
}
