import { hasClusterAccess, type DbOpinionResponse } from '@/db/opinion-repository';

export async function canViewOpinionResponse(
  response: Pick<DbOpinionResponse, 'cluster' | 'userId' | 'published'>,
  viewerUserId: string | null,
): Promise<boolean> {
  // Unpublished responses are visible only to the author.
  if (!response.published) {
    return viewerUserId !== null && viewerUserId === response.userId;
  }

  const { visibility, ownerUserId } = response.cluster;

  if (visibility === 'Public') return true;
  if (viewerUserId && ownerUserId === viewerUserId) return true;
  if (visibility === 'Shared' && viewerUserId) {
    return hasClusterAccess(response.cluster.id, viewerUserId);
  }
  return false;
}
