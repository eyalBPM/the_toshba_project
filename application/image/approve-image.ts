import type { DomainUser } from '@/domain/types';
import { canApproveImage } from '@/domain/permissions/rules';
import { findImageById, updateImageStatus } from '@/db/image-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface ApproveImageInput {
  actingUser: DomainUser;
  imageId: string;
}

export async function approveImage(input: ApproveImageInput): Promise<void> {
  if (!canApproveImage(input.actingUser.role)) {
    throw new Error('Only admins can approve images');
  }

  const image = await findImageById(input.imageId);
  if (!image) throw new Error('Image not found');
  if (image.status !== 'PendingApproval') throw new Error('Image is not pending approval');

  await updateImageStatus(input.imageId, 'Approved');

  await createAuditLog({
    action: 'IMAGE_APPROVED',
    entityType: 'Image',
    entityId: input.imageId,
    userId: input.actingUser.id,
    metadata: { revisionId: image.revisionId },
  });

  await createNotification({
    userId: image.uploadedByUserId,
    type: 'IMAGE_APPROVED',
    entityType: 'Image',
    entityId: input.imageId,
    message: 'התמונה שהעלית אושרה',
  });
}
