import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { createOpinionResponse } from '@/application/opinion/create-response';

const createSchema = z.object({
  revisionId: z.string().min(1),
  clusterId: z.string().optional(),
});

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

    const result = await createOpinionResponse({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId: parsed.data.revisionId,
      clusterId: parsed.data.clusterId,
    });

    return apiSuccess(result, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Revision not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only verified')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
