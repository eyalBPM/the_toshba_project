import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { createArticlesView } from '@/application/table-views/manage-table-views';

const bodySchema = z.object({
  name: z.string().min(1).max(80),
  config: z.unknown(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid body', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }
    const created = await createArticlesView(user.id, {
      name: parsed.data.name,
      config: parsed.data.config,
    });
    return apiSuccess(created, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (err instanceof z.ZodError) {
      return ApiErrors.validationError('Invalid config', {
        fields: err.flatten().fieldErrors,
      });
    }
    return ApiErrors.internal();
  }
}
