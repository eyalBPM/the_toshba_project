import { prisma } from './prisma';

export interface DbNotification {
  id: string;
  userId: string;
  type: string;
  entityType: string;
  entityId: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  type: true,
  entityType: true,
  entityId: true,
  message: true,
  read: true,
  createdAt: true,
} as const;

export async function createNotification(data: {
  userId: string;
  type: string;
  entityType: string;
  entityId: string;
  message: string;
}): Promise<void> {
  await prisma.notification.create({ data });
}

export async function listNotificationsByUser(
  userId: string,
  opts: { unreadOnly?: boolean; cursor?: string; limit?: number } = {},
): Promise<DbNotification[]> {
  const limit = opts.limit ?? 50;
  return prisma.notification.findMany({
    where: {
      userId,
      ...(opts.unreadOnly ? { read: false } : {}),
    },
    select: NOTIFICATION_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
}

export async function countUnreadByUser(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await prisma.notification.delete({ where: { id: notificationId } });
}

export async function findNotificationById(
  notificationId: string,
): Promise<DbNotification | null> {
  return prisma.notification.findUnique({
    where: { id: notificationId },
    select: NOTIFICATION_SELECT,
  });
}
