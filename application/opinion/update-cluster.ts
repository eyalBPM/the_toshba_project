import type { DomainUser, ClusterVisibility } from '@/domain/types';
import { canEditCluster } from '@/domain/opinion/rules';
import {
  findClusterById,
  updateCluster as dbUpdate,
  addClusterAccess,
  removeClusterAccess,
  listClusterAccessUsers,
  type DbOpinionCluster,
} from '@/db/opinion-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface UpdateClusterInput {
  user: DomainUser;
  clusterId: string;
  title?: string;
  introduction?: string | null;
  visibility?: string;
  accessUserIds?: string[];
}

export async function updateOpinionCluster(
  input: UpdateClusterInput,
): Promise<DbOpinionCluster> {
  const cluster = await findClusterById(input.clusterId);
  if (!cluster) throw new Error('Cluster not found');

  const guard = canEditCluster(
    { id: cluster.id, ownerUserId: cluster.ownerUserId, visibility: cluster.visibility as ClusterVisibility },
    input.user.id,
  );
  if (!guard.success) throw new Error(guard.error);

  const updated = await dbUpdate(input.clusterId, {
    title: input.title,
    introduction: input.introduction,
    visibility: input.visibility,
  });

  // Sync access list if provided and visibility is Shared
  if (input.accessUserIds !== undefined) {
    const currentAccess = await listClusterAccessUsers(input.clusterId);
    const currentUserIds = new Set(currentAccess.map((a) => a.userId));
    const targetUserIds = new Set(input.accessUserIds);

    // Remove users no longer in the list
    for (const access of currentAccess) {
      if (!targetUserIds.has(access.userId)) {
        await removeClusterAccess(input.clusterId, access.userId);
      }
    }

    // Add new users
    for (const userId of input.accessUserIds) {
      if (!currentUserIds.has(userId)) {
        await addClusterAccess(input.clusterId, userId);
      }
    }
  }

  await createAuditLog({
    action: 'OPINION_CLUSTER_UPDATED',
    entityType: 'OpinionCluster',
    entityId: input.clusterId,
    userId: input.user.id,
  });

  return updated;
}
