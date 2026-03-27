import { findTopicByText, createTopic, type DbTopic } from '@/db/topic-repository';

export async function findOrCreateTopic(text: string): Promise<DbTopic> {
  const existing = await findTopicByText(text);
  if (existing) return existing;
  return createTopic(text);
}
