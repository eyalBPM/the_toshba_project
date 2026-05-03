import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { adminVerifyUser } from '@/application/verification/admin-verify-user';
import { revokeVerification } from '@/application/verification/revoke-verification';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const user = await requireAuth();
    const { userId } = await params;

    await adminVerifyUser({
      actingUser: { id: user.id, status: user.status, role: user.role },
      targetUserId: userId,
    });

    return apiSuccess({ verified: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'User not found') return ApiErrors.notFound(msg);
    if (msg.startsWith('Only admins')) return ApiErrors.forbidden(msg);
    if (msg.startsWith('Cannot') || msg.startsWith('User is already')) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const user = await requireAuth();
    const { userId } = await params;

    await revokeVerification({
      actingUser: { id: user.id, status: user.status, role: user.role },
      targetUserId: userId,
    });

    return apiSuccess({ revoked: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'User not found') return ApiErrors.notFound(msg);
    if (msg.startsWith('Only admins')) return ApiErrors.forbidden(msg);
    if (msg.startsWith('Cannot') || msg.startsWith('User is not')) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}
