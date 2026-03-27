import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import { apiSuccess, ApiErrors } from '@/lib/api-error';
import { findRevisionById } from '@/db/revision-repository';
import { updateRevision } from '@/application/revision/update-revision';
import { deleteDraft } from '@/application/revision/delete-draft';

const updateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.unknown().optional(),
  snapshot: z
    .object({
      sourcesSnapshot: z.unknown().optional(),
      topicsSnapshot: z.unknown().optional(),
      sagesSnapshot: z.unknown().optional(),
      referencesSnapshot: z.unknown().optional(),
      contentLength: z.number().optional(),
    })
    .optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const revision = await findRevisionById(id);
    if (!revision) return ApiErrors.notFound('Revision not found');
    return apiSuccess(revision);
  } catch {
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

    const { editPolicy } = await updateRevision({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId: id,
      title: parsed.data.title,
      content: parsed.data.content ?? {},
      snapshot: parsed.data.snapshot ?? {},
    });

    return apiSuccess({ editPolicy });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Revision not found') return ApiErrors.notFound(msg);
    if (
      msg === 'Only the revision creator can edit it' ||
      msg.startsWith('Cannot edit')
    ) {
      return ApiErrors.forbidden(msg);
    }
    return ApiErrors.internal();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await deleteDraft({
      user: { id: user.id, status: user.status, role: user.role },
      revisionId: id,
    });

    return apiSuccess({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'UNAUTHORIZED') return ApiErrors.unauthorized();
    if (msg === 'Revision not found') return ApiErrors.notFound(msg);
    if (
      msg === 'Only the revision creator can delete it' ||
      msg === 'Only draft revisions can be deleted'
    ) {
      return ApiErrors.forbidden(msg);
    }
    return ApiErrors.internal();
  }
}
