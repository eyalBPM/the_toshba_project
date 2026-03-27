import { describe, it, expect } from 'vitest';
import {
  canApproveRevision,
  canRejectRevision,
  shouldAutoApprove,
  getCompetingRevisionPolicy,
} from '../revision/approval';
import type { DomainUser, DomainRevision } from '../types';

function makeUser(overrides: Partial<DomainUser> = {}): DomainUser {
  return { id: 'user-1', status: 'VerifiedUser', role: 'Admin', ...overrides };
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

describe('revision approval', () => {
  describe('canApproveRevision', () => {
    it('allows admin to approve pending revision', () => {
      expect(canApproveRevision(makeUser(), makeRevision())).toEqual({ success: true });
    });

    it('rejects non-admin approval', () => {
      const result = canApproveRevision(makeUser({ role: 'User' }), makeRevision());
      expect(result.success).toBe(false);
    });

    it('rejects approval of non-pending revision', () => {
      const result = canApproveRevision(makeUser(), makeRevision({ status: 'Draft' }));
      expect(result.success).toBe(false);
    });
  });

  describe('canRejectRevision', () => {
    it('allows admin to reject without note', () => {
      expect(canRejectRevision(makeUser(), makeRevision())).toEqual({ success: true });
    });

    it('allows senior to reject with note', () => {
      const result = canRejectRevision(
        makeUser({ role: 'Senior' }),
        makeRevision(),
        'This needs more sources',
      );
      expect(result).toEqual({ success: true });
    });

    it('rejects senior rejection without note', () => {
      const result = canRejectRevision(makeUser({ role: 'Senior' }), makeRevision());
      expect(result.success).toBe(false);
    });

    it('rejects senior rejection with empty note', () => {
      const result = canRejectRevision(makeUser({ role: 'Senior' }), makeRevision(), '   ');
      expect(result.success).toBe(false);
    });

    it('rejects regular user rejection', () => {
      const result = canRejectRevision(makeUser({ role: 'User' }), makeRevision());
      expect(result.success).toBe(false);
    });

    it('rejects rejection of non-pending revision', () => {
      const result = canRejectRevision(makeUser(), makeRevision({ status: 'Approved' }));
      expect(result.success).toBe(false);
    });
  });

  describe('shouldAutoApprove', () => {
    it('returns true at threshold', () => {
      expect(shouldAutoApprove(35)).toBe(true);
    });

    it('returns false below threshold', () => {
      expect(shouldAutoApprove(34)).toBe(false);
    });
  });

  describe('getCompetingRevisionPolicy', () => {
    it('returns reject when not minor change', () => {
      expect(getCompetingRevisionPolicy(false)).toBe('reject');
    });

    it('returns keep when minor change', () => {
      expect(getCompetingRevisionPolicy(true)).toBe('keep');
    });
  });
});
