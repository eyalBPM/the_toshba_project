import { describe, it, expect } from 'vitest';
import {
  canVerify,
  canRequestVerification,
  validateVerificationTransition,
} from '../verification/rules';
import type { DomainUser } from '../types';

function makeUser(overrides: Partial<DomainUser> = {}): DomainUser {
  return { id: 'user-1', status: 'VerifiedUser', role: 'User', ...overrides };
}

describe('verification rules', () => {
  describe('canVerify', () => {
    it('allows verified user to verify others', () => {
      expect(canVerify(makeUser())).toEqual({ success: true });
    });

    it('rejects unverified verifier', () => {
      const result = canVerify(makeUser({ status: 'PendingVerification' }));
      expect(result.success).toBe(false);
    });
  });

  describe('canRequestVerification', () => {
    it('allows pending user to request verification', () => {
      expect(canRequestVerification(makeUser({ status: 'PendingVerification' }))).toEqual({
        success: true,
      });
    });

    it('rejects already verified user', () => {
      const result = canRequestVerification(makeUser());
      expect(result.success).toBe(false);
    });
  });

  describe('validateVerificationTransition', () => {
    it('allows Pending -> Approved', () => {
      expect(validateVerificationTransition('Pending', 'Approved')).toEqual({ success: true });
    });

    it('allows Pending -> Rejected', () => {
      expect(validateVerificationTransition('Pending', 'Rejected')).toEqual({ success: true });
    });

    it('disallows any transition from Approved', () => {
      expect(validateVerificationTransition('Approved', 'Pending').success).toBe(false);
      expect(validateVerificationTransition('Approved', 'Rejected').success).toBe(false);
    });

    it('disallows any transition from Rejected', () => {
      expect(validateVerificationTransition('Rejected', 'Pending').success).toBe(false);
      expect(validateVerificationTransition('Rejected', 'Approved').success).toBe(false);
    });
  });
});
