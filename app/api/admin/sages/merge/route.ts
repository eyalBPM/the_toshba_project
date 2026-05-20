import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { mergeSages } from '@/application/sage/merge-sages';
import {
  EntityMergeNotFoundError,
  EntityMergeSameIdError,
} from '@/db/entity-merge';

const BodySchema = z.object({
  victimId: z.string().min(1),
  winnerId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', { issues: parsed.error.issues });
    }

    const result = await mergeSages({
      actingUser: { id: user.id, status: user.status, role: user.role },
      victimId: parsed.data.victimId,
      winnerId: parsed.data.winnerId,
    });

    return apiSuccess(result);
  } catch (err) {
    if (err instanceof EntityMergeSameIdError) {
      return ApiErrors.badRequest(err.message);
    }
    if (err instanceof EntityMergeNotFoundError) {
      return ApiErrors.notFound(err.message);
    }
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    return ApiErrors.internal();
  }
}
