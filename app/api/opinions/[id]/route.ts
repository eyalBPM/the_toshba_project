import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, getCurrentUser } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { findResponseById } from '@/db/opinion-repository';
import { updateOpinionResponse } from '@/application/opinion/update-response';
import { deleteOpinionResponse } from '@/application/opinion/delete-response';
import { canViewOpinionResponse } from '@/application/opinion/can-view-response';

const updateSchema = z
  .object({
    content: z.unknown().optional(),
    clusterId: z.string().min(1).optional(),
  })
  .refine((v) => v.content !== undefined || v.clusterId !== undefined, {
    message: 'At least one of content or clusterId is required',
  });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [response, viewer] = await Promise.all([
      findResponseById(id),
      getCurrentUser(),
    ]);
    if (!response) return ApiErrors.notFound('Response not found');

    const allowed = await canViewOpinionResponse(response, viewer?.id ?? null);
    if (!allowed) return ApiErrors.notFound('Response not found');

    return apiSuccess(response);
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

    const updated = await updateOpinionResponse({
      user: { id: user.id, status: user.status, role: user.role },
      responseId: id,
      content: parsed.data.content,
      clusterId: parsed.data.clusterId,
    });

    return apiSuccess(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Response not found') return ApiErrors.notFound(msg);
    if (msg === 'Target cluster not found') return ApiErrors.notFound(msg);
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

    await deleteOpinionResponse({
      user: { id: user.id, status: user.status, role: user.role },
      responseId: id,
    });

    return apiSuccess({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Response not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
