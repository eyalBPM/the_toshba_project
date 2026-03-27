import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { findClusterById, removeClusterAccess } from '@/db/opinion-repository';
import { canManageClusterAccess } from '@/domain/opinion/rules';
import type { ClusterVisibility } from '@/domain/types';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const user = await requireAuth();
    const { id, userId: targetUserId } = await params;

    const cluster = await findClusterById(id);
    if (!cluster) return ApiErrors.notFound('Cluster not found');

    const guard = canManageClusterAccess(
      { id: cluster.id, ownerUserId: cluster.ownerUserId, visibility: cluster.visibility as ClusterVisibility },
      user.id,
    );
    if (!guard.success) return ApiErrors.forbidden(guard.error);

    await removeClusterAccess(id, targetUserId);
    return apiSuccess({ removed: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
