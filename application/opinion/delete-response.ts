import type { DomainUser } from '@/domain/types';
import { canDeleteResponse } from '@/domain/opinion/rules';
import { findResponseById, deleteResponse as dbDelete } from '@/db/opinion-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface DeleteResponseInput {
  user: DomainUser;
  responseId: string;
}

export async function deleteOpinionResponse(input: DeleteResponseInput): Promise<void> {
  const response = await findResponseById(input.responseId);
  if (!response) throw new Error('Response not found');

  const guard = canDeleteResponse(
    { id: response.id, clusterId: response.clusterId, revisionId: response.revisionId, userId: response.userId },
    input.user.id,
  );
  if (!guard.success) throw new Error(guard.error);

  await dbDelete(input.responseId);

  await createAuditLog({
    action: 'OPINION_RESPONSE_DELETED',
    entityType: 'OpinionResponse',
    entityId: input.responseId,
    userId: input.user.id,
    metadata: { clusterId: response.clusterId, revisionId: response.revisionId },
  });
}
