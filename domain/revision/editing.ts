import type { DomainRevision, Result } from '../types';
import { ok, fail } from '../types';

export interface EditPolicy {
  willResetAgreements: boolean;
  requiresWarning: boolean;
}

export function getEditPolicy(
  agreementCount: number,
  isMinorChangeApproved: boolean,
): EditPolicy {
  if (isMinorChangeApproved) {
    return { willResetAgreements: false, requiresWarning: false };
  }
  const hasAgreements = agreementCount > 0;
  return {
    willResetAgreements: hasAgreements,
    requiresWarning: hasAgreements,
  };
}

export function canEditRevision(revision: DomainRevision, userId: string): Result {
  if (revision.createdByUserId !== userId) {
    return fail('Only the revision creator can edit it');
  }
  if (revision.status !== 'Draft' && revision.status !== 'Pending') {
    return fail(`Cannot edit a revision with status '${revision.status}'`);
  }
  return ok();
}
