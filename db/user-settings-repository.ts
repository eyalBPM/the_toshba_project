import { prisma } from './prisma';

export interface DbUserSettings {
  id: string;
  userId: string;
  activeTableViewId: string | null;
}

const USER_SETTINGS_SELECT = {
  id: true,
  userId: true,
  activeTableViewId: true,
} as const;

export async function findUserSettings(userId: string): Promise<DbUserSettings | null> {
  return prisma.userSettings.findUnique({
    where: { userId },
    select: USER_SETTINGS_SELECT,
  });
}

export async function ensureUserSettings(userId: string): Promise<DbUserSettings> {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: USER_SETTINGS_SELECT,
  });
}

export async function setActiveTableView(
  userId: string,
  tableViewId: string | null,
): Promise<DbUserSettings> {
  return prisma.userSettings.update({
    where: { userId },
    data: { activeTableViewId: tableViewId },
    select: USER_SETTINGS_SELECT,
  });
}
