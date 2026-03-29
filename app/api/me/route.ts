import { getCurrentUser } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ApiErrors.unauthorized();

    return apiSuccess({
      id: user.id,
      role: user.role,
      status: user.status,
    });
  } catch {
    return ApiErrors.internal();
  }
}
