import type { RevisionStatus, Result } from '../types';
import { ok, fail } from '../types';

const VALID_TRANSITIONS: Record<RevisionStatus, readonly RevisionStatus[]> = {
  Draft: ['Pending'],
  Pending: ['Draft', 'Approved', 'Rejected'],
  Approved: [],
  Rejected: [],
};

const TERMINAL_STATUSES: ReadonlySet<RevisionStatus> = new Set(['Approved', 'Rejected']);

export function canTransition(from: RevisionStatus, to: RevisionStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function validateTransition(from: RevisionStatus, to: RevisionStatus): Result {
  if (canTransition(from, to)) {
    return ok();
  }
  return fail(`Cannot transition revision from '${from}' to '${to}'`);
}

export function isTerminalStatus(status: RevisionStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}
