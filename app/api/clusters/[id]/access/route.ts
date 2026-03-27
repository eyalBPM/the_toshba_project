import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import {
  findClusterById,
  listClusterAccessUsers,
  addClusterAccess,
} from '@/db/opinion-repository';
import { canManageClusterAccess } from '@/domain/opinion/rules';
import type { ClusterVisibility } from '@/domain/types';

const addSchema = z.object({
  userId: z.string().min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const cluster = await findClusterById(id);
    if (!cluster) return ApiErrors.notFound('Cluster not found');

    const guard = canManageClusterAccess(
      { id: cluster.id, ownerUserId: cluster.ownerUserId, visibility: cluster.visibility as ClusterVisibility },
      user.id,
    );
    if (!guard.success) return ApiErrors.forbidden(guard.error);

    const accessList = await listClusterAccessUsers(id);
    return apiSuccess(accessList);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const cluster = await findClusterById(id);
    if (!cluster) return ApiErrors.notFound('Cluster not found');

    const guard = canManageClusterAccess(
      { id: cluster.id, ownerUserId: cluster.ownerUserId, visibility: cluster.visibility as ClusterVisibility },
      user.id,
    );
    if (!guard.success) return ApiErrors.forbidden(guard.error);

    const access = await addClusterAccess(id, parsed.data.userId);
    return apiSuccess(access, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
