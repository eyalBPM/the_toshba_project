import { describe, it, expect } from 'vitest';
import { generateSlug, resolveSlugConflict } from '../article/slug';

describe('slug generation', () => {
  describe('generateSlug', () => {
    it('transliterates Hebrew title to URL-safe slug', () => {
      const slug = generateSlug('שלום');
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug.length).toBeGreaterThan(0);
    });

    it('lowercases the result', () => {
      const slug = generateSlug('Hello World');
      expect(slug).toBe(slug.toLowerCase());
    });

    it('replaces spaces with hyphens', () => {
      const slug = generateSlug('hello world test');
      expect(slug).toBe('hello-world-test');
    });

    it('removes special transliteration characters', () => {
      const slug = generateSlug('שלום');
      expect(slug).not.toMatch(/[ʾʿ]/);
    });

    it('collapses consecutive hyphens', () => {
      const slug = generateSlug('hello   world');
      expect(slug).not.toContain('--');
    });

    it('trims leading and trailing hyphens', () => {
      const slug = generateSlug(' hello ');
      expect(slug).not.toMatch(/^-|-$/);
    });

    it('handles mixed Hebrew and Latin characters', () => {
      const slug = generateSlug('תורה Torah');
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug).toContain('torah');
    });
  });

  describe('resolveSlugConflict', () => {
    it('returns baseSlug if no conflict', () => {
      expect(resolveSlugConflict('hello', new Set())).toBe('hello');
    });

    it('appends -2 on first conflict', () => {
      expect(resolveSlugConflict('hello', new Set(['hello']))).toBe('hello-2');
    });

    it('appends -3 when -2 is also taken', () => {
      expect(resolveSlugConflict('hello', new Set(['hello', 'hello-2']))).toBe('hello-3');
    });

    it('handles large suffix numbers', () => {
      const existing = new Set(['hello', ...Array.from({ length: 98 }, (_, i) => `hello-${i + 2}`)]);
      expect(resolveSlugConflict('hello', existing)).toBe('hello-100');
    });
  });
});
