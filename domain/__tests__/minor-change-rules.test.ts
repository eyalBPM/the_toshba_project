import { describe, it, expect } from 'vitest';
import {
  canRequestMinorChange,
  validateMinorChangeTransition,
} from '../minor-change/rules';
import type { DomainUser, DomainRevision } from '../types';

function makeUser(overrides: Partial<DomainUser> = {}): DomainUser {
  return { id: 'user-1', status: 'VerifiedUser', role: 'User', ...overrides };
}

function makeRevision(overrides: Partial<DomainRevision> = {}): DomainRevision {
  return {
    id: 'rev-1',
    articleId: 'art-1',
    status: 'Pending',
    createdByUserId: 'user-1',
    ...overrides,
  };
}

describe('minor change rules', () => {
  describe('canRequestMinorChange', () => {
    it('allows owner of Pending revision', () => {
      expect(canRequestMinorChange(makeUser(), makeRevision())).toEqual({ success: true });
    });

    it('rejects non-owner', () => {
      const result = canRequestMinorChange(
        makeUser({ id: 'other-user' }),
        makeRevision(),
      );
      expect(result.success).toBe(false);
    });

    it('rejects Draft revision', () => {
      const result = canRequestMinorChange(
        makeUser(),
        makeRevision({ status: 'Draft' }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects Approved revision', () => {
      const result = canRequestMinorChange(
        makeUser(),
        makeRevision({ status: 'Approved' }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects Rejected revision', () => {
      const result = canRequestMinorChange(
        makeUser(),
        makeRevision({ status: 'Rejected' }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe('validateMinorChangeTransition', () => {
    it('allows Pending -> Approved', () => {
      expect(validateMinorChangeTransition('Pending', 'Approved')).toEqual({ success: true });
    });

    it('allows Pending -> Rejected', () => {
      expect(validateMinorChangeTransition('Pending', 'Rejected')).toEqual({ success: true });
    });

    it('allows Approved -> Used', () => {
      expect(validateMinorChangeTransition('Approved', 'Used')).toEqual({ success: true });
    });

    it('rejects Pending -> Used', () => {
      const result = validateMinorChangeTransition('Pending', 'Used');
      expect(result.success).toBe(false);
    });

    it('rejects Rejected -> Approved', () => {
      const result = validateMinorChangeTransition('Rejected', 'Approved');
      expect(result.success).toBe(false);
    });

    it('rejects Used -> Pending', () => {
      const result = validateMinorChangeTransition('Used', 'Pending');
      expect(result.success).toBe(false);
    });

    it('rejects Approved -> Rejected', () => {
      const result = validateMinorChangeTransition('Approved', 'Rejected');
      expect(result.success).toBe(false);
    });
  });
});
