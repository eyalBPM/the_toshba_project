import type { DomainUser } from '@/domain/types';
import { findPrintListById, deletePrintList as dbDelete } from '@/db/print-list-repository';
import { createAuditLog } from '@/db/audit-log-repository';

export interface DeletePrintListInput {
  user: DomainUser;
  printListId: string;
}

export async function deletePrintList(input: DeletePrintListInput): Promise<void> {
  const list = await findPrintListById(input.printListId);
  if (!list) throw new Error('Print list not found');
  if (list.userId !== input.user.id) throw new Error('Only the owner can delete this list');

  await createAuditLog({
    action: 'PRINT_LIST_DELETED',
    entityType: 'PrintList',
    entityId: input.printListId,
    userId: input.user.id,
  });

  await dbDelete(input.printListId);
}
