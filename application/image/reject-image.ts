import type { DomainUser } from '@/domain/types';
import { canApproveImage } from '@/domain/permissions/rules';
import { findImageById, updateImageStatus } from '@/db/image-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface RejectImageInput {
  actingUser: DomainUser;
  imageId: string;
  note?: string;
}

export async function rejectImage(input: RejectImageInput): Promise<void> {
  if (!canApproveImage(input.actingUser.role)) {
    throw new Error('Only admins can reject images');
  }

  const image = await findImageById(input.imageId);
  if (!image) throw new Error('Image not found');
  if (image.status !== 'PendingApproval') throw new Error('Image is not pending approval');

  await updateImageStatus(input.imageId, 'Rejected');

  await createAuditLog({
    action: 'IMAGE_REJECTED',
    entityType: 'Image',
    entityId: input.imageId,
    userId: input.actingUser.id,
    metadata: { revisionId: image.revisionId, note: input.note },
  });

  await createNotification({
    userId: image.uploadedByUserId,
    type: 'IMAGE_REJECTED',
    entityType: 'Image',
    entityId: input.imageId,
    message: input.note
      ? `התמונה שהעלית נדחתה: ${input.note}`
      : 'התמונה שהעלית נדחתה',
  });
}
