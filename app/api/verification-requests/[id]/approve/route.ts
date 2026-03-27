import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { approveVerification } from '@/application/verification/approve-verification';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await approveVerification({
      requestId: id,
      actingUser: { id: user.id, status: user.status, role: user.role },
    });

    return apiSuccess({ approved: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Verification request not found') return ApiErrors.notFound(msg);
    if (msg === 'Not authorized to act on this request') return ApiErrors.forbidden(msg);
    if (msg.startsWith('Cannot transition') || msg.startsWith('Only verified')) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}
