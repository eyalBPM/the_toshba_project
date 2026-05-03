import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { findVerificationRequestById } from '@/db/verification-repository';
import { cancelVerification } from '@/application/verification/cancel-verification';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const request = await findVerificationRequestById(id);
    if (!request) return ApiErrors.notFound('Verification request not found');
    return apiSuccess(request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await cancelVerification({
      requestId: id,
      actingUser: { id: user.id, status: user.status, role: user.role },
    });
    return apiSuccess({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Verification request not found') return ApiErrors.notFound(msg);
    if (msg === 'Not authorized to cancel this request') return ApiErrors.forbidden(msg);
    if (msg === 'Only pending requests can be cancelled') return ApiErrors.badRequest(msg);
    return ApiErrors.internal();
  }
}
