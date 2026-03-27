import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { findClusterById } from '@/db/opinion-repository';
import { updateOpinionCluster } from '@/application/opinion/update-cluster';
import { deleteOpinionCluster } from '@/application/opinion/delete-cluster';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  introduction: z.string().nullable().optional(),
  visibility: z.enum(['Private', 'Shared', 'Public']).optional(),
  accessUserIds: z.array(z.string()).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cluster = await findClusterById(id);
    if (!cluster) return ApiErrors.notFound('Cluster not found');
    return apiSuccess(cluster);
  } catch {
    return ApiErrors.internal();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const updated = await updateOpinionCluster({
      user: { id: user.id, status: user.status, role: user.role },
      clusterId: id,
      ...parsed.data,
    });

    return apiSuccess(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Cluster not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await deleteOpinionCluster({
      user: { id: user.id, status: user.status, role: user.role },
      clusterId: id,
    });

    return apiSuccess({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Cluster not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
