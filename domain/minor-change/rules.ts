import type { DomainUser, DomainRevision, MinorChangeRequestStatus, Result } from '../types';
import { ok, fail } from '../types';

export function canRequestMinorChange(
  user: DomainUser,
  revision: DomainRevision,
): Result {
  if (revision.createdByUserId !== user.id) {
    return fail('Only the revision creator can request a minor change');
  }
  if (revision.status !== 'Pending') {
    return fail('Minor changes can only be requested for Pending revisions');
  }
  return ok();
}

const VALID_TRANSITIONS: Record<string, MinorChangeRequestStatus[]> = {
  Pending: ['Approved', 'Rejected'],
  Approved: ['Used'],
};

export function validateMinorChangeTransition(
  current: MinorChangeRequestStatus,
  target: MinorChangeRequestStatus,
): Result {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    return fail(`Cannot transition minor change request from '${current}' to '${target}'`);
  }
  return ok();
}
