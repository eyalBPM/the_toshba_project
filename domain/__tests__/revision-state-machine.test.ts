import { describe, it, expect } from 'vitest';
import { canTransition, validateTransition, isTerminalStatus } from '../revision/state-machine';
import type { RevisionStatus } from '../types';

describe('revision state machine', () => {
  describe('canTransition', () => {
    it('allows Draft -> Pending', () => {
      expect(canTransition('Draft', 'Pending')).toBe(true);
    });

    it('allows Pending -> Draft (retract)', () => {
      expect(canTransition('Pending', 'Draft')).toBe(true);
    });

    it('allows Pending -> Approved', () => {
      expect(canTransition('Pending', 'Approved')).toBe(true);
    });

    it('allows Pending -> Rejected', () => {
      expect(canTransition('Pending', 'Rejected')).toBe(true);
    });

    it('disallows Draft -> Approved', () => {
      expect(canTransition('Draft', 'Approved')).toBe(false);
    });

    it('disallows Draft -> Rejected', () => {
      expect(canTransition('Draft', 'Rejected')).toBe(false);
    });

    it('allows Draft -> Obsolete', () => {
      expect(canTransition('Draft', 'Obsolete')).toBe(true);
    });

    it('allows Pending -> Obsolete', () => {
      expect(canTransition('Pending', 'Obsolete')).toBe(true);
    });

    it('disallows any transition from Approved', () => {
      const targets: RevisionStatus[] = ['Draft', 'Pending', 'Approved', 'Rejected', 'Obsolete'];
      for (const to of targets) {
        expect(canTransition('Approved', to)).toBe(false);
      }
    });

    it('disallows any transition from Rejected', () => {
      const targets: RevisionStatus[] = ['Draft', 'Pending', 'Approved', 'Rejected', 'Obsolete'];
      for (const to of targets) {
        expect(canTransition('Rejected', to)).toBe(false);
      }
    });

    it('disallows any transition from Obsolete', () => {
      const targets: RevisionStatus[] = ['Draft', 'Pending', 'Approved', 'Rejected', 'Obsolete'];
      for (const to of targets) {
        expect(canTransition('Obsolete', to)).toBe(false);
      }
    });

    it('disallows same-status transitions', () => {
      expect(canTransition('Draft', 'Draft')).toBe(false);
      expect(canTransition('Pending', 'Pending')).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('returns ok for valid transitions', () => {
      expect(validateTransition('Draft', 'Pending')).toEqual({ success: true });
    });

    it('returns error with descriptive message for invalid transitions', () => {
      const result = validateTransition('Draft', 'Approved');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Draft');
        expect(result.error).toContain('Approved');
      }
    });
  });

  describe('isTerminalStatus', () => {
    it('returns true for Approved', () => {
      expect(isTerminalStatus('Approved')).toBe(true);
    });

    it('returns true for Rejected', () => {
      expect(isTerminalStatus('Rejected')).toBe(true);
    });

    it('returns false for Draft', () => {
      expect(isTerminalStatus('Draft')).toBe(false);
    });

    it('returns false for Pending', () => {
      expect(isTerminalStatus('Pending')).toBe(false);
    });

    it('returns true for Obsolete', () => {
      expect(isTerminalStatus('Obsolete')).toBe(true);
    });
  });
});
