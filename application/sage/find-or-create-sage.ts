import { findSageByText, createSage, type DbSage } from '@/db/sage-repository';

export async function findOrCreateSage(text: string): Promise<DbSage> {
  const existing = await findSageByText(text);
  if (existing) return existing;
  return createSage(text);
}
