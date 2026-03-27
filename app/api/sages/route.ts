import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireVerified } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { listSages } from '@/db/sage-repository';
import { findOrCreateSage } from '@/application/sage/find-or-create-sage';

const createSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

export async function GET(request: NextRequest) {
  try {
    await requireVerified();
    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const sages = await listSages({ search });
    return apiSuccess(sages);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireVerified();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }
    const sage = await findOrCreateSage(parsed.data.text);
    return apiSuccess(sage, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
