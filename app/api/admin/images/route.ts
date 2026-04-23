import { requireRole } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { listPendingImages } from '@/db/image-repository';

export async function GET() {
  try {
    await requireRole('Admin', 'Senior', 'Moderator');
    const images = await listPendingImages();
    return apiSuccess(images);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    return ApiErrors.internal();
  }
}
