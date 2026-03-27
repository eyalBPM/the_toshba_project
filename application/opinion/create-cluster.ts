import type { DomainUser } from '@/domain/types';
import { canWriteResponse } from '@/domain/permissions/rules';
import { createCluster as dbCreate, type DbOpinionCluster } from '@/db/opinion-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface CreateClusterInput {
  user: DomainUser;
  title: string;
  introduction?: string;
  visibility?: string;
}

export async function createOpinionCluster(
  input: CreateClusterInput,
): Promise<DbOpinionCluster> {
  if (!canWriteResponse(input.user.status)) {
    throw new Error('Only verified users can create clusters');
  }

  const cluster = await dbCreate({
    title: input.title,
    ownerUserId: input.user.id,
    introduction: input.introduction,
    visibility: input.visibility,
  });

  await createAuditLog({
    action: 'OPINION_CLUSTER_CREATED',
    entityType: 'OpinionCluster',
    entityId: cluster.id,
    userId: input.user.id,
  });

  return cluster;
}
