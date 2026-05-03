import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireVerified } from '@/lib/auth-utils';
import { apiSuccess, apiError, ApiErrors } from '@/lib/api-error';
import {
  createRevision,
  ActiveRevisionAlreadyExistsError,
} from '@/application/revision/create-revision';

const createSchema = z.object({
  title: z.string().min(1).optional(),
  articleId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerified();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { revisionId } = await createRevision({
      user: { id: user.id, status: user.status, role: user.role },
      title: parsed.data.title,
      articleId: parsed.data.articleId,
    });

    return apiSuccess({ revisionId }, 201);
  } catch (err) {
    if (err instanceof ActiveRevisionAlreadyExistsError) {
      return apiError(
        'ACTIVE_REVISION_ALREADY_EXISTS',
        err.message,
        409,
        { existingRevisionId: err.existingRevisionId },
      );
    }
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') return ApiErrors.unauthorized();
    if (msg === 'Only verified users can create revisions') return ApiErrors.forbidden(msg);
    if (msg === 'Article not found') return ApiErrors.notFound(msg);
    if (msg === 'Title is required') return ApiErrors.validationError(msg);
    return ApiErrors.internal();
  }
}
