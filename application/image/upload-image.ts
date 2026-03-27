import type { DomainUser, RevisionStatus } from '@/domain/types';
import { canWriteResponse } from '@/domain/permissions/rules';
import { findRevisionById } from '@/db/revision-repository';
import { createImage, type DbImage } from '@/db/image-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface UploadImageInput {
  user: DomainUser;
  revisionId: string;
  url: string;
}

export async function uploadImage(input: UploadImageInput): Promise<DbImage> {
  if (!canWriteResponse(input.user.status)) {
    throw new Error('Only verified users can upload images');
  }

  const revision = await findRevisionById(input.revisionId);
  if (!revision) throw new Error('Revision not found');

  if (revision.createdByUserId !== input.user.id) {
    throw new Error('Only the revision author can upload images');
  }

  const image = await createImage({
    revisionId: input.revisionId,
    url: input.url,
    uploadedByUserId: input.user.id,
  });

  await createAuditLog({
    action: 'IMAGE_UPLOADED',
    entityType: 'Image',
    entityId: image.id,
    userId: input.user.id,
    metadata: { revisionId: input.revisionId },
  });

  return image;
}
