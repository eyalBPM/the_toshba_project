import type { DomainUser } from '@/domain/types';
import { canEditResponse } from '@/domain/opinion/rules';
import {
  findResponseById,
  updateResponseContent,
  type DbOpinionResponse,
} from '@/db/opinion-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface UpdateResponseInput {
  user: DomainUser;
  responseId: string;
  content: unknown;
}

export async function updateOpinionResponse(
  input: UpdateResponseInput,
): Promise<DbOpinionResponse> {
  const response = await findResponseById(input.responseId);
  if (!response) throw new Error('Response not found');

  const guard = canEditResponse(
    { id: response.id, clusterId: response.clusterId, revisionId: response.revisionId, userId: response.userId },
    input.user.id,
  );
  if (!guard.success) throw new Error(guard.error);

  const updated = await updateResponseContent(input.responseId, input.content);

  await createAuditLog({
    action: 'OPINION_RESPONSE_EDITED',
    entityType: 'OpinionResponse',
    entityId: input.responseId,
    userId: input.user.id,
  });

  return updated;
}
