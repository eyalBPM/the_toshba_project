import { hasClusterAccess, type DbOpinionResponse } from '@/db/opinion-repository';

export async function canViewOpinionResponse(
  response: Pick<DbOpinionResponse, 'cluster'>,
  viewerUserId: string | null,
): Promise<boolean> {
  const { visibility, ownerUserId } = response.cluster;

  if (visibility === 'Public') return true;
  if (viewerUserId && ownerUserId === viewerUserId) return true;
  if (visibility === 'Shared' && viewerUserId) {
    return hasClusterAccess(response.cluster.id, viewerUserId);
  }
  return false;
}
