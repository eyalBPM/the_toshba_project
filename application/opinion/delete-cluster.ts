import type { DomainUser, ClusterVisibility } from '@/domain/types';
import { canEditCluster } from '@/domain/opinion/rules';
import {
  findClusterById,
  deleteCluster as dbDelete,
  countClustersByUser,
  reassignResponsesBetweenClusters,
} from '@/db/opinion-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface DeleteClusterInput {
  user: DomainUser;
  clusterId: string;
  targetClusterId?: string;
}

export async function deleteOpinionCluster(input: DeleteClusterInput): Promise<void> {
  const cluster = await findClusterById(input.clusterId);
  if (!cluster) throw new Error('Cluster not found');

  const guard = canEditCluster(
    { id: cluster.id, ownerUserId: cluster.ownerUserId, visibility: cluster.visibility as ClusterVisibility },
    input.user.id,
  );
  if (!guard.success) throw new Error(guard.error);

  const ownerClusterCount = await countClustersByUser(cluster.ownerUserId);
  if (ownerClusterCount <= 1) {
    throw new Error('Cannot delete the only cluster — create another cluster first');
  }

  const responseCount = cluster._count.responses;
  let movedCount = 0;

  if (responseCount > 0) {
    if (!input.targetClusterId) {
      throw new Error('Target cluster required to move existing responses');
    }
    if (input.targetClusterId === input.clusterId) {
      throw new Error('Target cluster must differ from the cluster being deleted');
    }

    const target = await findClusterById(input.targetClusterId);
    if (!target) throw new Error('Target cluster not found');
    if (target.ownerUserId !== input.user.id) {
      throw new Error('Only your own clusters can receive moved responses');
    }

    movedCount = await reassignResponsesBetweenClusters(
      input.clusterId,
      input.targetClusterId,
    );
  }

  await dbDelete(input.clusterId);

  await createAuditLog({
    action: 'OPINION_CLUSTER_DELETED',
    entityType: 'OpinionCluster',
    entityId: input.clusterId,
    userId: input.user.id,
    ...(movedCount > 0
      ? { metadata: { movedResponses: movedCount, targetClusterId: input.targetClusterId } }
      : {}),
  });
}
