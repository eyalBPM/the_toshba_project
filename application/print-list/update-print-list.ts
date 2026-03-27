import type { DomainUser } from '@/domain/types';
import {
  findPrintListById,
  updatePrintListSettings,
  type DbPrintList,
} from '@/db/print-list-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface UpdatePrintListInput {
  user: DomainUser;
  printListId: string;
  settings: unknown;
}

export async function updatePrintList(input: UpdatePrintListInput): Promise<DbPrintList> {
  const list = await findPrintListById(input.printListId);
  if (!list) throw new Error('Print list not found');
  if (list.userId !== input.user.id) throw new Error('Only the owner can edit this list');

  const updated = await updatePrintListSettings(input.printListId, input.settings);

  await createAuditLog({
    action: 'PRINT_LIST_UPDATED',
    entityType: 'PrintList',
    entityId: input.printListId,
    userId: input.user.id,
  });

  return updated;
}
