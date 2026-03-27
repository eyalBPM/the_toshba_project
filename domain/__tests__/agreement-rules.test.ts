import { describe, it, expect } from 'vitest';
import { canAgree, hasReachedThreshold } from '../agreement/rules';
import type { DomainUser, DomainRevision } from '../types';

function makeUser(overrides: Partial<DomainUser> = {}): DomainUser {
  return { id: 'user-1', status: 'VerifiedUser', role: 'User', ...overrides };
}

function makeRevision(overrides: Partial<DomainRevision> = {}): DomainRevision {
  return {
    id: 'rev-1',
    articleId: null,
    status: 'Pending',
    createdByUserId: 'user-2',
    ...overrides,
  };
}

describe('agreement rules', () => {
  describe('canAgree', () => {
    it('allows verified user to agree on pending revision by another user', () => {
      expect(canAgree(makeUser(), makeRevision())).toEqual({ success: true });
    });

    it('rejects unverified user', () => {
      const result = canAgree(makeUser({ status: 'PendingVerification' }), makeRevision());
      expect(result.success).toBe(false);
    });

    it('rejects agreement on Draft revision', () => {
      const result = canAgree(makeUser(), makeRevision({ status: 'Draft' }));
      expect(result.success).toBe(false);
    });

    it('rejects agreement on Approved revision', () => {
      const result = canAgree(makeUser(), makeRevision({ status: 'Approved' }));
      expect(result.success).toBe(false);
    });

    it('rejects agreement on Rejected revision', () => {
      const result = canAgree(makeUser(), makeRevision({ status: 'Rejected' }));
      expect(result.success).toBe(false);
    });

    it('rejects self-agreement', () => {
      const result = canAgree(
        makeUser({ id: 'same-user' }),
        makeRevision({ createdByUserId: 'same-user' }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe('hasReachedThreshold', () => {
    it('returns false when count < 35', () => {
      expect(hasReachedThreshold(34)).toBe(false);
    });

    it('returns true when count == 35', () => {
      expect(hasReachedThreshold(35)).toBe(true);
    });

    it('returns true when count > 35', () => {
      expect(hasReachedThreshold(36)).toBe(true);
    });

    it('returns false for 0', () => {
      expect(hasReachedThreshold(0)).toBe(false);
    });
  });
});
