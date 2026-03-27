import { prisma } from './prisma';

// ─── Types ──────────────────────────────────────────────

export interface DbOpinionCluster {
  id: string;
  title: string;
  introduction: string | null;
  ownerUserId: string;
  visibility: string;
  createdAt: Date;
  owner: { id: string; name: string };
  _count: { responses: number };
}

export interface DbOpinionResponse {
  id: string;
  clusterId: string;
  revisionId: string;
  userId: string;
  content: unknown;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string };
  cluster: { id: string; title: string; visibility: string; ownerUserId: string };
}

export interface DbClusterAccess {
  id: string;
  clusterId: string;
  userId: string;
  user: { id: string; name: string };
}

// ─── Select Objects ─────────────────────────────────────

const CLUSTER_SELECT = {
  id: true,
  title: true,
  introduction: true,
  ownerUserId: true,
  visibility: true,
  createdAt: true,
  owner: { select: { id: true, name: true } },
  _count: { select: { responses: true } },
} as const;

const RESPONSE_SELECT = {
  id: true,
  clusterId: true,
  revisionId: true,
  userId: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true } },
  cluster: { select: { id: true, title: true, visibility: true, ownerUserId: true } },
} as const;

const ACCESS_SELECT = {
  id: true,
  clusterId: true,
  userId: true,
  user: { select: { id: true, name: true } },
} as const;

// ─── Cluster Operations ─────────────────────────────────

export async function createCluster(data: {
  title: string;
  ownerUserId: string;
  introduction?: string;
  visibility?: string;
}): Promise<DbOpinionCluster> {
  return prisma.opinionCluster.create({
    data: {
      title: data.title,
      ownerUserId: data.ownerUserId,
      introduction: data.introduction ?? null,
      visibility: (data.visibility as 'Private' | 'Shared' | 'Public') ?? 'Private',
    },
    select: CLUSTER_SELECT,
  });
}

export async function findClusterById(id: string): Promise<DbOpinionCluster | null> {
  return prisma.opinionCluster.findUnique({ where: { id }, select: CLUSTER_SELECT });
}

export async function findDefaultClusterForUser(
  userId: string,
): Promise<DbOpinionCluster | null> {
  return prisma.opinionCluster.findFirst({
    where: { ownerUserId: userId },
    orderBy: { createdAt: 'asc' },
    select: CLUSTER_SELECT,
  });
}

export async function listClustersByUser(userId: string): Promise<DbOpinionCluster[]> {
  return prisma.opinionCluster.findMany({
    where: { ownerUserId: userId },
    orderBy: { createdAt: 'desc' },
    select: CLUSTER_SELECT,
  });
}

export async function updateCluster(
  id: string,
  data: {
    title?: string;
    introduction?: string | null;
    visibility?: string;
  },
): Promise<DbOpinionCluster> {
  return prisma.opinionCluster.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.introduction !== undefined ? { introduction: data.introduction } : {}),
      ...(data.visibility !== undefined
        ? { visibility: data.visibility as 'Private' | 'Shared' | 'Public' }
        : {}),
    },
    select: CLUSTER_SELECT,
  });
}

export async function deleteCluster(id: string): Promise<void> {
  await prisma.opinionCluster.delete({ where: { id } });
}

// ─── Access Operations ──────────────────────────────────

export async function addClusterAccess(
  clusterId: string,
  userId: string,
): Promise<DbClusterAccess> {
  return prisma.opinionClusterAccess.create({
    data: { clusterId, userId },
    select: ACCESS_SELECT,
  });
}

export async function removeClusterAccess(
  clusterId: string,
  userId: string,
): Promise<void> {
  await prisma.opinionClusterAccess.deleteMany({
    where: { clusterId, userId },
  });
}

export async function listClusterAccessUsers(
  clusterId: string,
): Promise<DbClusterAccess[]> {
  return prisma.opinionClusterAccess.findMany({
    where: { clusterId },
    select: ACCESS_SELECT,
  });
}

export async function hasClusterAccess(
  clusterId: string,
  userId: string,
): Promise<boolean> {
  const access = await prisma.opinionClusterAccess.findFirst({
    where: { clusterId, userId },
    select: { id: true },
  });
  return access !== null;
}

// ─── Response Operations ────────────────────────────────

export async function createResponse(data: {
  clusterId: string;
  revisionId: string;
  userId: string;
  content?: unknown;
}): Promise<DbOpinionResponse> {
  return prisma.opinionResponse.create({
    data: {
      clusterId: data.clusterId,
      revisionId: data.revisionId,
      userId: data.userId,
      content: (data.content ?? {}) as object,
    },
    select: RESPONSE_SELECT,
  });
}

export async function findResponseById(id: string): Promise<DbOpinionResponse | null> {
  return prisma.opinionResponse.findUnique({ where: { id }, select: RESPONSE_SELECT });
}

export async function updateResponseContent(
  id: string,
  content: unknown,
): Promise<DbOpinionResponse> {
  return prisma.opinionResponse.update({
    where: { id },
    data: { content: content as object },
    select: RESPONSE_SELECT,
  });
}

export async function deleteResponse(id: string): Promise<void> {
  await prisma.opinionResponse.delete({ where: { id } });
}

export async function listResponsesByRevision(
  revisionId: string,
  viewerUserId: string | null,
  opts: { cursor?: string; limit?: number } = {},
): Promise<DbOpinionResponse[]> {
  const limit = opts.limit ?? 50;
  // Build visibility filter: Public OR owner OR (Shared AND access)
  const visibilityFilter = viewerUserId
    ? {
        OR: [
          { cluster: { visibility: 'Public' as const } },
          { cluster: { ownerUserId: viewerUserId } },
          {
            cluster: {
              visibility: 'Shared' as const,
              access: { some: { userId: viewerUserId } },
            },
          },
        ],
      }
    : { cluster: { visibility: 'Public' as const } };

  return prisma.opinionResponse.findMany({
    where: { revisionId, ...visibilityFilter },
    select: RESPONSE_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
}

export async function listResponsesByCluster(
  clusterId: string,
): Promise<DbOpinionResponse[]> {
  return prisma.opinionResponse.findMany({
    where: { clusterId },
    select: RESPONSE_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function listResponsesByUser(userId: string): Promise<DbOpinionResponse[]> {
  return prisma.opinionResponse.findMany({
    where: { userId },
    select: RESPONSE_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}
