import { listImagesByRevision } from '@/db/image-repository';
import type { ImageStatus } from '@/db/generated/prisma/enums';

export type ImageStatusMap = Record<string, ImageStatus>;

export async function getImageStatusMap(revisionId: string): Promise<ImageStatusMap> {
  const images = await listImagesByRevision(revisionId);
  const map: ImageStatusMap = {};
  for (const img of images) {
    map[img.id] = img.status;
  }
  return map;
}
