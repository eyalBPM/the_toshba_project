import { describe, it, expect } from 'vitest';
import { SYSTEM_CONFIG } from '@/lib/config';

describe('SYSTEM_CONFIG', () => {
  it('should have agreement threshold of 35', () => {
    expect(SYSTEM_CONFIG.AGREEMENT_THRESHOLD).toBe(35);
  });
});
