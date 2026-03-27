import { prisma } from './prisma';

export interface DbTopic {
  id: string;
  text: string;
}

const TOPIC_SELECT = { id: true, text: true } as const;

export async function findTopicByText(text: string): Promise<DbTopic | null> {
  return prisma.topic.findUnique({ where: { text }, select: TOPIC_SELECT });
}

export async function findTopicById(id: string): Promise<DbTopic | null> {
  return prisma.topic.findUnique({ where: { id }, select: TOPIC_SELECT });
}

export async function listTopics(opts: { search?: string } = {}): Promise<DbTopic[]> {
  return prisma.topic.findMany({
    where: opts.search
      ? { text: { contains: opts.search, mode: 'insensitive' } }
      : undefined,
    select: TOPIC_SELECT,
    orderBy: { text: 'asc' },
    take: 50,
  });
}

export async function createTopic(text: string): Promise<DbTopic> {
  return prisma.topic.create({ data: { text }, select: TOPIC_SELECT });
}
