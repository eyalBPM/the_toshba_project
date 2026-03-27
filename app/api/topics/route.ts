import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireVerified } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { listTopics } from '@/db/topic-repository';
import { findOrCreateTopic } from '@/application/topic/find-or-create-topic';

const createSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

export async function GET(request: NextRequest) {
  try {
    await requireVerified();
    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const topics = await listTopics({ search });
    return apiSuccess(topics);
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
    const topic = await findOrCreateTopic(parsed.data.text);
    return apiSuccess(topic, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED' || msg === 'FORBIDDEN') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}
