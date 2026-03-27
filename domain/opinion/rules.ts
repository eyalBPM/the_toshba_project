import type { DomainCluster, DomainOpinionResponse, Result } from '../types';
import { ok, fail } from '../types';

export function canEditResponse(
  response: DomainOpinionResponse,
  userId: string,
): Result {
  if (response.userId !== userId) {
    return fail('Only the response author can edit it');
  }
  return ok();
}

export function canDeleteResponse(
  response: DomainOpinionResponse,
  userId: string,
): Result {
  if (response.userId !== userId) {
    return fail('Only the response author can delete it');
  }
  return ok();
}

export function canViewCluster(
  cluster: DomainCluster,
  userId: string,
  hasAccess: boolean,
): Result {
  if (cluster.visibility === 'Public') return ok();
  if (cluster.ownerUserId === userId) return ok();
  if (cluster.visibility === 'Shared' && hasAccess) return ok();
  return fail('You do not have access to this cluster');
}

export function canEditCluster(
  cluster: DomainCluster,
  userId: string,
): Result {
  if (cluster.ownerUserId !== userId) {
    return fail('Only the cluster owner can edit it');
  }
  return ok();
}

export function canManageClusterAccess(
  cluster: DomainCluster,
  userId: string,
): Result {
  if (cluster.ownerUserId !== userId) {
    return fail('Only the cluster owner can manage access');
  }
  return ok();
}
