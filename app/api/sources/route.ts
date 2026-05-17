import type { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { getCachedSources } from '@/lib/sources-cache';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { createManySources } from '@/db/source-repository';

export async function GET() {
  try {
    const sources = await getCachedSources();
    return apiSuccess(sources);
  } catch {
    return ApiErrors.internal();
  }
}

const sourceSchema = z.object({
  id: z.string().min(1).optional(),
  book: z.string().min(1),
  label: z.string().min(1),
  path: z.string().min(1),
  index: z.number().int(),
});

const bodySchema = z.object({
  sources: z.array(sourceSchema).min(1),
});

export async function POST(request: NextRequest) {
  const expected = process.env.SOURCES_ADMIN_SECRET;
  if (!expected) return ApiErrors.internal('SOURCES_ADMIN_SECRET not configured');

  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || token !== expected) return ApiErrors.unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiErrors.badRequest('Invalid JSON body');
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.validationError('Invalid input', {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await createManySources(parsed.data.sources);
    revalidateTag('sources', { expire: 0 });
    return apiSuccess({ inserted: result.count }, 201);
  } catch {
    return ApiErrors.internal();
  }
}
