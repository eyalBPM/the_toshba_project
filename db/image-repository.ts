import { prisma } from './prisma';

export interface DbImage {
  id: string;
  revisionId: string;
  url: string;
  uploadedByUserId: string;
  status: string;
  createdAt: Date;
  uploadedBy: { id: string; name: string };
  revision: { id: string; title: string };
}

const IMAGE_SELECT = {
  id: true,
  revisionId: true,
  url: true,
  uploadedByUserId: true,
  status: true,
  createdAt: true,
  uploadedBy: { select: { id: true, name: true } },
  revision: { select: { id: true, title: true } },
} as const;

export async function findImageById(id: string): Promise<DbImage | null> {
  return prisma.image.findUnique({ where: { id }, select: IMAGE_SELECT });
}

export async function listPendingImages(): Promise<DbImage[]> {
  return prisma.image.findMany({
    where: { status: 'PendingApproval' },
    select: IMAGE_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function listImages(opts: { status?: string } = {}): Promise<DbImage[]> {
  return prisma.image.findMany({
    where: opts.status ? { status: opts.status } : {},
    select: IMAGE_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateImageStatus(
  id: string,
  status: string,
): Promise<DbImage> {
  return prisma.image.update({
    where: { id },
    data: { status },
    select: IMAGE_SELECT,
  });
}

export async function countPendingImages(): Promise<number> {
  return prisma.image.count({ where: { status: 'PendingApproval' } });
}

export async function createImage(data: {
  revisionId: string;
  url: string;
  uploadedByUserId: string;
}): Promise<DbImage> {
  return prisma.image.create({
    data: {
      revisionId: data.revisionId,
      url: data.url,
      uploadedByUserId: data.uploadedByUserId,
      status: 'PendingApproval',
    },
    select: IMAGE_SELECT,
  });
}

export async function listImagesByRevision(revisionId: string): Promise<DbImage[]> {
  return prisma.image.findMany({
    where: { revisionId },
    select: IMAGE_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteImage(id: string): Promise<void> {
  await prisma.image.delete({ where: { id } });
}
