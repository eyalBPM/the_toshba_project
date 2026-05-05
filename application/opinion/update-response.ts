import type { DomainUser } from '@/domain/types';
import { canEditResponse } from '@/domain/opinion/rules';
import {
  findResponseById,
  findClusterById,
  updateResponseFields,
  type DbOpinionResponse,
} from '@/db/opinion-repository';
import { canViewOpinionResponse } from './can-view-response';
import { createAuditLog } from '@/db/audit-log-repository';

export interface UpdateResponseInput {
  user: DomainUser;
  responseId: string;
  content?: unknown;
  clusterId?: string;
}

export async function updateOpinionResponse(
  input: UpdateResponseInput,
): Promise<DbOpinionResponse> {
  const response = await findResponseById(input.responseId);
  if (!response) throw new Error('Response not found');

  const visible = await canViewOpinionResponse(response, input.user.id);
  if (!visible) throw new Error('Response not found');

  const guard = canEditResponse(
    { id: response.id, clusterId: response.clusterId, articleId: response.articleId, userId: response.userId },
    input.user.id,
  );
  if (!guard.success) throw new Error(guard.error);

  if (input.clusterId !== undefined && input.clusterId !== response.clusterId) {
    const target = await findClusterById(input.clusterId);
    if (!target) throw new Error('Target cluster not found');
    if (target.ownerUserId !== input.user.id) {
      throw new Error('Only your own clusters can hold your responses');
    }
  }

  const updated = await updateResponseFields(input.responseId, {
    content: input.content,
    clusterId: input.clusterId,
  });

  await createAuditLog({
    action: 'OPINION_RESPONSE_EDITED',
    entityType: 'OpinionResponse',
    entityId: input.responseId,
    userId: input.user.id,
    ...(input.clusterId !== undefined && input.clusterId !== response.clusterId
      ? { metadata: { fromClusterId: response.clusterId, toClusterId: input.clusterId } }
      : {}),
  });

  return updated;
}
