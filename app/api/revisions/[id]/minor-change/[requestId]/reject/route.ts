import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { rejectMinorChange } from '@/application/minor-change/reject-minor-change';

const rejectSchema = z.object({
  note: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  try {
    const user = await requireRole('Admin', 'Senior', 'Moderator');
    const { requestId } = await params;

    const body = await request.json();
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    await rejectMinorChange({
      actingUser: { id: user.id, status: user.status, role: user.role },
      requestId,
      note: parsed.data.note,
    });

    return apiSuccess({ rejected: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    if (msg === 'Minor change request not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only') || msg.includes('Cannot transition')) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}
