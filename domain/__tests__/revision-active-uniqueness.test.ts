import { describe, it, expect } from 'vitest';
import {
  isActiveRevisionStatus,
  countsTowardActiveLimit,
} from '../revision/active-uniqueness';
import type { RevisionStatus } from '../types';

describe('revision active uniqueness rules', () => {
  describe('isActiveRevisionStatus', () => {
    it.each<[RevisionStatus, boolean]>([
      ['Draft', true],
      ['Pending', true],
      ['Approved', false],
      ['Rejected', false],
      ['Obsolete', false],
    ])('isActiveRevisionStatus(%s) === %s', (status, expected) => {
      expect(isActiveRevisionStatus(status)).toBe(expected);
    });
  });

  describe('countsTowardActiveLimit', () => {
    it('counts Draft attached to an article', () => {
      expect(countsTowardActiveLimit('Draft', 'article-1')).toBe(true);
    });

    it('counts Pending attached to an article', () => {
      expect(countsTowardActiveLimit('Pending', 'article-1')).toBe(true);
    });

    it('does not count new-article drafts (articleId null)', () => {
      expect(countsTowardActiveLimit('Draft', null)).toBe(false);
      expect(countsTowardActiveLimit('Pending', null)).toBe(false);
    });

    it('does not count terminal statuses even when attached to an article', () => {
      expect(countsTowardActiveLimit('Approved', 'article-1')).toBe(false);
      expect(countsTowardActiveLimit('Rejected', 'article-1')).toBe(false);
      expect(countsTowardActiveLimit('Obsolete', 'article-1')).toBe(false);
    });
  });
});
