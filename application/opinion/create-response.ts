import type { DomainUser } from '@/domain/types';
import { canWriteResponse } from '@/domain/permissions/rules';
import {
  findDefaultClusterForUser,
  createCluster,
  createResponse as dbCreateResponse,
  type DbOpinionResponse,
} from '@/db/opinion-repository';
import { findRevisionById } from '@/db/revision-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface CreateResponseInput {
  user: DomainUser;
  revisionId: string;
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

  const revision = await findRevisionById(input.revisionId);
  if (!revision) throw new Error('Revision not found');

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
    revisionId: input.revisionId,
    userId: input.user.id,
  });

  await createAuditLog({
    action: 'OPINION_RESPONSE_CREATED',
    entityType: 'OpinionResponse',
    entityId: response.id,
    userId: input.user.id,
    metadata: { clusterId, revisionId: input.revisionId },
  });

  return { responseId: response.id, clusterId };
}
