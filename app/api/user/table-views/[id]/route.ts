import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import {
  updateArticlesView,
  deleteArticlesView,
  ManageTableViewError,
} from '@/application/table-views/manage-table-views';

const patchSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    config: z.unknown().optional(),
  })
  .refine((d) => d.name !== undefined || d.config !== undefined, {
    message: 'At least one of name or config is required',
  });

function mapError(err: unknown) {
  if (err instanceof Error && err.message === 'UNAUTHORIZED') {
    return ApiErrors.unauthorized();
  }
  if (err instanceof ManageTableViewError) {
    if (err.code === 'NOT_FOUND') return ApiErrors.notFound(err.message);
    if (err.code === 'FORBIDDEN') return ApiErrors.forbidden(err.message);
  }
  if (err instanceof z.ZodError) {
    return ApiErrors.validationError('Invalid config', {
      fields: err.flatten().fieldErrors,
    });
  }
  return ApiErrors.internal();
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const raw = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(raw);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid body', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }
    const updated = await updateArticlesView(user.id, id, parsed.data);
    return apiSuccess(updated);
  } catch (err) {
    return mapError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    await deleteArticlesView(user.id, id);
    return apiSuccess({ ok: true });
  } catch (err) {
    return mapError(err);
  }
}
