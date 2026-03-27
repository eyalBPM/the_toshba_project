/**
 * Central configuration for system-wide constants.
 * Domain logic must read thresholds from here, never hardcode them.
 */
export const SYSTEM_CONFIG = {
  /** Number of agreements required to approve a revision */
  AGREEMENT_THRESHOLD: 35,

  /** Application name */
  APP_NAME: 'תושב"ע',
} as const;
