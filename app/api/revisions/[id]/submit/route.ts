import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { submitRevision } from '@/application/revision/submit-revision';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await submitRevision({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId: id,
    });

    return apiSuccess({ submitted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Revision not found') return ApiErrors.notFound(msg);
    if (
      msg === 'Only the revision creator can submit it' ||
      msg.startsWith('Cannot transition')
    ) {
      return ApiErrors.forbidden(msg);
    }
    if (msg === 'Revision title cannot be empty') return ApiErrors.badRequest(msg);
    return ApiErrors.internal();
  }
}
