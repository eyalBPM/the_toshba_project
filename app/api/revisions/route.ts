import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireVerified } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { createRevision } from '@/application/revision/create-revision';

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
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
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') return ApiErrors.unauthorized();
    if (msg === 'Only verified users can create revisions') return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
