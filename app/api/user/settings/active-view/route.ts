import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import {
  setActiveArticlesView,
  ManageTableViewError,
} from '@/application/table-views/manage-table-views';

const bodySchema = z.object({
  tableViewId: z.string().min(1).nullable(),
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
    await setActiveArticlesView(user.id, parsed.data.tableViewId);
    return apiSuccess({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (err instanceof ManageTableViewError) {
      if (err.code === 'NOT_FOUND') return ApiErrors.notFound(err.message);
      if (err.code === 'FORBIDDEN') return ApiErrors.forbidden(err.message);
    }
    return ApiErrors.internal();
  }
}
