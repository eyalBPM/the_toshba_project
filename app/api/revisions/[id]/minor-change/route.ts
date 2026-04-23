import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { canApproveMinorChange } from '@/domain/permissions/rules';
import { requestMinorChange } from '@/application/minor-change/request-minor-change';
import { listMinorChangeRequestsByRevision } from '@/db/minor-change-repository';

const createSchema = z.object({
  message: z.string().optional(),
  title: z.string().optional(),
  content: z.unknown().optional(),
  snapshotData: z.unknown().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: revisionId } = await params;

    const requests = await listMinorChangeRequestsByRevision(revisionId);

    // Users who can approve minor changes see all requests; others see only their own.
    const filtered = canApproveMinorChange(user.role)
      ? requests
      : requests.filter((r) => r.requestingUserId === user.id);

    return apiSuccess(filtered);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    return ApiErrors.internal();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: revisionId } = await params;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.validationError('Invalid input', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await requestMinorChange({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId,
      message: parsed.data.message,
      title: parsed.data.title,
      content: parsed.data.content,
      snapshotData: parsed.data.snapshotData,
    });

    return apiSuccess({ id: result.id }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Revision not found') return ApiErrors.notFound('Revision not found');
    if (msg.includes('Only') || msg.includes('pending minor change')) {
      return ApiErrors.badRequest(msg);
    }
    return ApiErrors.internal();
  }
}
