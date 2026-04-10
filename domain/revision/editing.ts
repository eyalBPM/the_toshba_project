import type { DomainRevision, RevisionStatus, Result } from '../types';
import { ok, fail } from '../types';

export interface EditPolicy {
  willResetAgreements: boolean;
  requiresWarning: boolean;
}

export function getEditPolicy(agreementCount: number): EditPolicy {
  const hasAgreements = agreementCount > 0;
  return {
    willResetAgreements: hasAgreements,
    requiresWarning: hasAgreements,
  };
}

export function isEditableStatus(status: RevisionStatus): boolean {
  return status === 'Draft' || status === 'Pending';
}

export function canEditRevision(revision: DomainRevision, userId: string): Result {
  if (revision.createdByUserId !== userId) {
    return fail('Only the revision creator can edit it');
  }
  if (!isEditableStatus(revision.status)) {
    return fail(`Cannot edit a revision with status '${revision.status}'`);
  }
  return ok();
}

export interface FreshnessCheckResult {
  editable: boolean;
  reason?: 'approved' | 'rejected' | 'obsolete' | 'not_owner' | 'not_found';
  articleSlug?: string;
}

export function checkRevisionFreshness(
  status: RevisionStatus,
  isOwner: boolean,
  articleSlug?: string,
): FreshnessCheckResult {
  if (!isOwner) {
    return { editable: false, reason: 'not_owner' };
  }
  if (status === 'Approved') {
    return { editable: false, reason: 'approved', articleSlug };
  }
  if (status === 'Rejected') {
    return { editable: false, reason: 'rejected' };
  }
  if (status === 'Obsolete') {
    return { editable: false, reason: 'obsolete', articleSlug };
  }
  return { editable: true };
}
