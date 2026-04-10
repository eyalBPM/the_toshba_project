import { prisma } from './prisma';

export async function createAuditLog(data: {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      metadata: (data.metadata ?? {}) as object,
    },
  });
}
