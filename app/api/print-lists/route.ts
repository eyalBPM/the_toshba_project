import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { listPrintListsByUser } from '@/db/print-list-repository';
import { createPrintList } from '@/application/print-list/create-print-list';

const settingsSchema = z.object({
  includeExplanations: z.boolean().optional(),
  includeClusters: z.boolean().optional(),
  articleIds: z.array(z.string()).optional(),
  ordering: z.enum(['custom', 'creation', 'approval']).optional(),
});

const createSchema = z.object({
  settings: settingsSchema.optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const lists = await listPrintListsByUser(user.id);
    return apiSuccess(lists);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const list = await createPrintList({
      user: { id: user.id, status: user.status, role: user.role },
      settings: parsed.data.settings ?? {},
    });

    return apiSuccess(list, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg.includes('Only verified')) return ApiErrors.forbidden(msg);
    return ApiErrors.internal();
  }
}
