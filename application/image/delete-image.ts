import { promises as fs } from 'fs';
import path from 'path';
import type { DomainUser } from '@/domain/types';
import { findImageById, deleteImage as dbDelete } from '@/db/image-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface DeleteImageInput {
  user: DomainUser;
  imageId: string;
}

export async function deleteUserImage(input: DeleteImageInput): Promise<void> {
  const image = await findImageById(input.imageId);
  if (!image) throw new Error('Image not found');

  if (image.uploadedByUserId !== input.user.id) {
    throw new Error('Only the image uploader can delete it');
  }

  if (image.status !== 'PendingApproval') {
    throw new Error('Only pending images can be deleted');
  }

  // Delete file from filesystem
  try {
    const filePath = path.join(process.cwd(), 'public', image.url);
    await fs.unlink(filePath);
  } catch {
    // File may already be missing — continue with DB cleanup
  }

  await dbDelete(input.imageId);

  await createAuditLog({
    action: 'IMAGE_DELETED',
    entityType: 'Image',
    entityId: input.imageId,
    userId: input.user.id,
    metadata: { revisionId: image.revisionId },
  });
}
