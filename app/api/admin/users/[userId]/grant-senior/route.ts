import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { grantSeniorRole } from '@/application/user/grant-senior-role';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const user = await requireAuth();
    const { userId } = await params;

    await grantSeniorRole({
      actingUser: { id: user.id, status: user.status, role: user.role },
      targetUserId: userId,
    });

    return apiSuccess({ granted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'User not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only Senior') || msg.includes('Can only') || msg.includes('already')) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}
