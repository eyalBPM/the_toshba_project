import { prisma } from './prisma';

export interface DbTableView {
  id: string;
  userSettingsId: string;
  name: string;
  scope: string;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const TABLE_VIEW_SELECT = {
  id: true,
  userSettingsId: true,
  name: true,
  scope: true,
  config: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listTableViews(
  userSettingsId: string,
  scope: string,
): Promise<DbTableView[]> {
  return prisma.tableView.findMany({
    where: { userSettingsId, scope },
    select: TABLE_VIEW_SELECT,
    orderBy: { createdAt: 'asc' },
  });
}

export async function findTableViewById(id: string): Promise<DbTableView | null> {
  return prisma.tableView.findUnique({ where: { id }, select: TABLE_VIEW_SELECT });
}

export async function createTableView(data: {
  userSettingsId: string;
  name: string;
  scope: string;
  config: unknown;
}): Promise<DbTableView> {
  return prisma.tableView.create({
    data: {
      userSettingsId: data.userSettingsId,
      name: data.name,
      scope: data.scope,
      config: data.config as object,
    },
    select: TABLE_VIEW_SELECT,
  });
}

export async function updateTableView(
  id: string,
  data: { name?: string; config?: unknown },
): Promise<DbTableView> {
  return prisma.tableView.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.config !== undefined ? { config: data.config as object } : {}),
    },
    select: TABLE_VIEW_SELECT,
  });
}

export async function deleteTableView(id: string): Promise<void> {
  await prisma.tableView.delete({ where: { id } });
}
