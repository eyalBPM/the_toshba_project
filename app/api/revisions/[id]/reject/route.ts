import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { rejectRevision } from '@/application/revision/reject-revision';

const rejectSchema = z.object({
  note: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: revisionId } = await params;

    const body = await request.json();
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    await rejectRevision({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId,
      note: parsed.data.note,
    });

    return apiSuccess({ rejected: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    if (msg === 'Revision not found') return ApiErrors.notFound('Revision not found');
    if (msg.includes('Only') || msg.includes('must provide')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
