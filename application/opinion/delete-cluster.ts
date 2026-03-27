import type { DomainUser, ClusterVisibility } from '@/domain/types';
import { canEditCluster } from '@/domain/opinion/rules';
import { findClusterById, deleteCluster as dbDelete } from '@/db/opinion-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface DeleteClusterInput {
  user: DomainUser;
  clusterId: string;
}

export async function deleteOpinionCluster(input: DeleteClusterInput): Promise<void> {
  const cluster = await findClusterById(input.clusterId);
  if (!cluster) throw new Error('Cluster not found');

  const guard = canEditCluster(
    { id: cluster.id, ownerUserId: cluster.ownerUserId, visibility: cluster.visibility as ClusterVisibility },
    input.user.id,
  );
  if (!guard.success) throw new Error(guard.error);

  await dbDelete(input.clusterId);

  await createAuditLog({
    action: 'OPINION_CLUSTER_DELETED',
    entityType: 'OpinionCluster',
    entityId: input.clusterId,
    userId: input.user.id,
  });
}
