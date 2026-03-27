import type { DomainUser, MinorChangeRequestStatus } from '@/domain/types';
import { canApproveMinorChange } from '@/domain/permissions/rules';
import { validateMinorChangeTransition } from '@/domain/minor-change/rules';
import { prisma } from '@/db/prisma';
import {
  findMinorChangeRequestById,
  updateMinorChangeRequestStatus,
} from '@/db/minor-change-repository';
import { createAuditLog } from '@/db/audit-log-repository';
import { createNotification } from '@/db/notification-repository';

export interface RejectMinorChangeInput {
  actingUser: DomainUser;
  requestId: string;
  note?: string;
}

export async function rejectMinorChange(input: RejectMinorChangeInput): Promise<void> {
  if (!canApproveMinorChange(input.actingUser.role)) {
    throw new Error('Only admins can reject minor change requests');
  }

  const request = await findMinorChangeRequestById(input.requestId);
  if (!request) throw new Error('Minor change request not found');

  const transition = validateMinorChangeTransition(
    request.status as MinorChangeRequestStatus,
    'Rejected',
  );
  if (!transition.success) throw new Error(transition.error);

  await prisma.$transaction(async () => {
    await updateMinorChangeRequestStatus(
      input.requestId,
      'Rejected',
      input.actingUser.id,
      input.note,
    );

    await createAuditLog({
      action: 'MINOR_CHANGE_REJECTED',
      entityType: 'MinorChangeRequest',
      entityId: input.requestId,
      userId: input.actingUser.id,
      metadata: { revisionId: request.revisionId, note: input.note },
    });

    await createNotification({
      userId: request.requestingUserId,
      type: 'MINOR_CHANGE_REJECTED',
      entityType: 'MinorChangeRequest',
      entityId: input.requestId,
      message: input.note
        ? `בקשת השינוי המינורי נדחתה: ${input.note}`
        : 'בקשת השינוי המינורי נדחתה',
    });
  });
}
