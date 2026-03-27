import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { requestVerification } from '@/application/verification/request-verification';
import { findPendingRequestsByVerifier } from '@/db/verification-repository';

const createSchema = z.object({
  requestedVerifierId: z.string().min(1),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const requests = await findPendingRequestsByVerifier(user.id);
    return apiSuccess(requests);
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

    const { requestId } = await requestVerification({
      requestingUser: { id: user.id, status: user.status, role: user.role },
      requestedVerifierId: parsed.data.requestedVerifierId,
      message: parsed.data.message,
    });

    return apiSuccess({ requestId }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (
      msg === 'Only pending users can request verification' ||
      msg === 'Verifier not found' ||
      msg === 'Verifier must be a verified user' ||
      msg === 'Cannot request verification from yourself' ||
      msg === 'A pending request to this verifier already exists'
    ) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}
