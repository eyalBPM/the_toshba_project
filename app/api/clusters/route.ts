import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { listClustersByUser } from '@/db/opinion-repository';
import { createOpinionCluster } from '@/application/opinion/create-cluster';

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  introduction: z.string().optional(),
  visibility: z.enum(['Private', 'Shared', 'Public']).optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const clusters = await listClustersByUser(user.id);
    return apiSuccess(clusters);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const cluster = await createOpinionCluster({
      user: { id: user.id, status: user.status, role: user.role },
      title: parsed.data.title,
      introduction: parsed.data.introduction,
      visibility: parsed.data.visibility,
    });

    return apiSuccess(cluster, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg.includes('Only verified')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
