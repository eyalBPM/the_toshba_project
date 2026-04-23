import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { changeUserRole } from '@/application/user/change-user-role';

const BodySchema = z.object({
  role: z.enum(['User', 'Moderator', 'Senior', 'Admin']),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const user = await requireAuth();
    const { userId } = await params;

    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid role', { issues: parsed.error.issues });
    }

    await changeUserRole({
      actingUser: { id: user.id, status: user.status, role: user.role },
      targetUserId: userId,
      newRole: parsed.data.role,
    });

    return apiSuccess({ role: parsed.data.role });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'User not found') return ApiErrors.notFound(msg);
    if (msg.startsWith('Only admins')) return ApiErrors.forbidden(msg);
    if (
      msg.startsWith('Cannot') ||
      msg.startsWith('Can only') ||
      msg.includes('already has')
    ) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}
