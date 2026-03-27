import type { DomainUser, VerificationRequestStatus, Result } from '../types';
import { ok, fail } from '../types';

const VALID_VERIFICATION_TRANSITIONS: Record<
  VerificationRequestStatus,
  readonly VerificationRequestStatus[]
> = {
  Pending: ['Approved', 'Rejected'],
  Approved: [],
  Rejected: [],
};

export function canVerify(verifier: DomainUser): Result {
  if (verifier.status !== 'VerifiedUser') {
    return fail('Only verified users can verify others');
  }
  return ok();
}

export function canRequestVerification(user: DomainUser): Result {
  if (user.status !== 'PendingVerification') {
    return fail('Only pending users can request verification');
  }
  return ok();
}

export function validateVerificationTransition(
  from: VerificationRequestStatus,
  to: VerificationRequestStatus,
): Result {
  if (VALID_VERIFICATION_TRANSITIONS[from].includes(to)) {
    return ok();
  }
  return fail(`Cannot transition verification request from '${from}' to '${to}'`);
}
