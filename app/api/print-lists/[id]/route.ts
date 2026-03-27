import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { findPrintListById } from '@/db/print-list-repository';
import { updatePrintList } from '@/application/print-list/update-print-list';
import { deletePrintList } from '@/application/print-list/delete-print-list';

const settingsSchema = z.object({
  includeExplanations: z.boolean().optional(),
  includeClusters: z.boolean().optional(),
  articleIds: z.array(z.string()).optional(),
  ordering: z.enum(['custom', 'creation', 'approval']).optional(),
});

const updateSchema = z.object({
  settings: settingsSchema,
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const list = await findPrintListById(id);
    if (!list) return ApiErrors.notFound('Print list not found');
    if (list.userId !== user.id) return ApiErrors.forbidden();
    return apiSuccess(list);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const updated = await updatePrintList({
      user: { id: user.id, status: user.status, role: user.role },
      printListId: id,
      settings: parsed.data.settings,
    });

    return apiSuccess(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Print list not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await deletePrintList({
      user: { id: user.id, status: user.status, role: user.role },
      printListId: id,
    });

    return apiSuccess({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Print list not found') return ApiErrors.notFound(msg);
    if (msg.includes('Only')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
