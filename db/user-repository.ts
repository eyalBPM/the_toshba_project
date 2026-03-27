import { prisma } from './prisma';

export interface DbUser {
  id: string;
  email: string;
  password: string | null;
  name: string;
  googleId: string | null;
  status: string;
  role: string;
}

const SELECT_FIELDS = {
  id: true,
  email: true,
  password: true,
  name: true,
  googleId: true,
  status: true,
  role: true,
} as const;

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  return prisma.user.findUnique({ where: { email }, select: SELECT_FIELDS });
}

export async function findUserByGoogleId(googleId: string): Promise<DbUser | null> {
  return prisma.user.findUnique({ where: { googleId }, select: SELECT_FIELDS });
}

export async function findUserById(id: string): Promise<DbUser | null> {
  return prisma.user.findUnique({ where: { id }, select: SELECT_FIELDS });
}

export async function createUser(data: {
  email: string;
  name: string;
  password?: string;
  googleId?: string;
}): Promise<DbUser> {
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password ?? null,
      googleId: data.googleId ?? null,
    },
    select: SELECT_FIELDS,
  });
}

export async function updateUserGoogleId(userId: string, googleId: string): Promise<DbUser> {
  return prisma.user.update({
    where: { id: userId },
    data: { googleId },
    select: SELECT_FIELDS,
  });
}

export async function updateUserStatus(
  userId: string,
  status: string,
): Promise<DbUser> {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: SELECT_FIELDS,
  });
}

export async function updateUserRole(
  userId: string,
  role: string,
): Promise<DbUser> {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: SELECT_FIELDS,
  });
}

export async function listUsers(opts: {
  search?: string;
  status?: string;
  role?: string;
  cursor?: string;
  limit?: number;
}): Promise<DbUser[]> {
  const limit = opts.limit ?? 50;
  return prisma.user.findMany({
    where: {
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.role ? { role: opts.role } : {}),
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search, mode: 'insensitive' } },
              { email: { contains: opts.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: SELECT_FIELDS,
    orderBy: { name: 'asc' },
    take: limit,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}
