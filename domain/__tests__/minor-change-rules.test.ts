import { describe, it, expect } from 'vitest';
import {
  canManageMinorChangeRequest,
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
  describe('canManageMinorChangeRequest', () => {
    it('allows revision creator', () => {
      expect(canManageMinorChangeRequest(makeUser(), makeRevision())).toBe(true);
    });

    it('allows Admin on any revision', () => {
      expect(
        canManageMinorChangeRequest(
          makeUser({ id: 'admin-1', role: 'Admin' }),
          makeRevision(),
        ),
      ).toBe(true);
    });

    it('allows Senior on any revision', () => {
      expect(
        canManageMinorChangeRequest(
          makeUser({ id: 'senior-1', role: 'Senior' }),
          makeRevision(),
        ),
      ).toBe(true);
    });

    it('rejects Moderator who is not the creator', () => {
      expect(
        canManageMinorChangeRequest(
          makeUser({ id: 'mod-1', role: 'Moderator' }),
          makeRevision(),
        ),
      ).toBe(false);
    });

    it('rejects regular user who is not the creator', () => {
      expect(
        canManageMinorChangeRequest(
          makeUser({ id: 'other-user' }),
          makeRevision(),
        ),
      ).toBe(false);
    });
  });

  describe('canRequestMinorChange', () => {
    it('allows owner of Pending revision', () => {
      expect(canRequestMinorChange(makeUser(), makeRevision())).toEqual({ success: true });
    });

    it('allows Admin on any Pending revision', () => {
      expect(
        canRequestMinorChange(
          makeUser({ id: 'admin-1', role: 'Admin' }),
          makeRevision(),
        ),
      ).toEqual({ success: true });
    });

    it('allows Senior on any Pending revision', () => {
      expect(
        canRequestMinorChange(
          makeUser({ id: 'senior-1', role: 'Senior' }),
          makeRevision(),
        ),
      ).toEqual({ success: true });
    });

    it('rejects Moderator who is not the creator', () => {
      const result = canRequestMinorChange(
        makeUser({ id: 'mod-1', role: 'Moderator' }),
        makeRevision(),
      );
      expect(result.success).toBe(false);
    });

    it('rejects regular non-owner', () => {
      const result = canRequestMinorChange(
        makeUser({ id: 'other-user' }),
        makeRevision(),
      );
      expect(result.success).toBe(false);
    });

    it('rejects Draft revision even for Admin', () => {
      const result = canRequestMinorChange(
        makeUser({ role: 'Admin' }),
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

    it('rejects Rejected -> Approved', () => {
      const result = validateMinorChangeTransition('Rejected', 'Approved');
      expect(result.success).toBe(false);
    });

    it('rejects Approved -> Rejected', () => {
      const result = validateMinorChangeTransition('Approved', 'Rejected');
      expect(result.success).toBe(false);
    });

    it('rejects Approved -> Pending', () => {
      const result = validateMinorChangeTransition('Approved', 'Pending');
      expect(result.success).toBe(false);
    });
  });
});
