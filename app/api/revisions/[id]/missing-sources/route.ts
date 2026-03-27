import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireVerified } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { findRevisionById } from '@/db/revision-repository';
import { createMissingSource } from '@/db/missing-source-repository';

const createSchema = z.object({
  citationNumber: z.number().int().positive(),
  text: z.string().min(1, 'Text is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireVerified();
    const { id: revisionId } = await params;

    const revision = await findRevisionById(revisionId);
    if (!revision) return ApiErrors.notFound('Revision not found');
    if (revision.createdByUserId !== user.id) return ApiErrors.forbidden('Not your revision');

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const missing = await createMissingSource({
      revisionId,
      citationNumber: parsed.data.citationNumber,
      text: parsed.data.text,
      createdByUserId: user.id,
    });

    return apiSuccess(missing, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'FORBIDDEN') return ApiErrors.forbidden();
    return ApiErrors.internal();
  }
}
