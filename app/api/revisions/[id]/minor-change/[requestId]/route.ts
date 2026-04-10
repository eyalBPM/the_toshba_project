import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { updateMinorChangeContent } from '@/application/minor-change/update-minor-change-content';
import { deleteMinorChange } from '@/application/minor-change/delete-minor-change';

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.unknown().optional(),
  snapshotData: z.unknown().optional(),
  message: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  try {
    const user = await requireAuth();
    const { requestId } = await params;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await updateMinorChangeContent({
      user: { id: user.id, status: user.status, role: user.role },
      requestId,
      title: parsed.data.title,
      content: parsed.data.content,
      snapshotData: parsed.data.snapshotData,
      message: parsed.data.message,
    });

    return apiSuccess({ id: result.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Minor change request not found') return ApiErrors.notFound(msg);
    if (msg === 'MCR_STATUS_CHANGED') {
      return ApiErrors.conflict('The minor change request was already approved or rejected');
    }
    if (msg.includes('Only')) return ApiErrors.badRequest(msg);
    return ApiErrors.internal();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: revisionId } = await params;

    await deleteMinorChange({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId,
    });

    return apiSuccess({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Revision not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only') || msg.includes('No pending')) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}
