import type { DomainUser } from '@/domain/types';
import { canWriteResponse } from '@/domain/permissions/rules';
import {
  findDefaultClusterForUser,
  createCluster,
  createResponse as dbCreateResponse,
} from '@/db/opinion-repository';
import { findArticleById } from '@/db/article-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface CreateResponseInput {
  user: DomainUser;
  articleId: string;
  clusterId?: string;
}

export interface CreateResponseResult {
  responseId: string;
  clusterId: string;
}

export async function createOpinionResponse(
  input: CreateResponseInput,
): Promise<CreateResponseResult> {
  if (!canWriteResponse(input.user.status)) {
    throw new Error('Only verified users can write responses');
  }

  const article = await findArticleById(input.articleId);
  if (!article) throw new Error('Article not found');
  if (!article.currentRevisionId) {
    // Articles only exist after a revision is approved — defensive guard.
    throw new Error('Article has no current revision');
  }

  let clusterId = input.clusterId;

  if (!clusterId) {
    // Auto-create default cluster if user has none
    let defaultCluster = await findDefaultClusterForUser(input.user.id);
    if (!defaultCluster) {
      defaultCluster = await createCluster({
        title: 'ברירת מחדל',
        ownerUserId: input.user.id,
        visibility: 'Private',
      });
    }
    clusterId = defaultCluster.id;
  }

  const response = await dbCreateResponse({
    clusterId,
    articleId: input.articleId,
    savedAtRevisionId: article.currentRevisionId,
    userId: input.user.id,
  });

  await createAuditLog({
    action: 'OPINION_RESPONSE_CREATED',
    entityType: 'OpinionResponse',
    entityId: response.id,
    userId: input.user.id,
    metadata: { clusterId, articleId: input.articleId },
  });

  return { responseId: response.id, clusterId };
}
