import {
  ensureUserSettings,
  setActiveTableView as repoSetActive,
} from '@/db/user-settings-repository';
import {
  createTableView as repoCreate,
  deleteTableView as repoDelete,
  findTableViewById,
  listTableViews,
  updateTableView as repoUpdate,
  type DbTableView,
} from '@/db/table-view-repository';
import {
  TABLE_VIEW_SCOPE_ARTICLES,
  articlesViewConfigSchema,
  type ArticlesViewConfig,
} from '@/domain/articles-list/view-config';

export interface ArticlesViewBundle {
  activeViewId: string | null;
  views: Array<{
    id: string;
    name: string;
    config: ArticlesViewConfig;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

function toArticlesView(view: DbTableView): ArticlesViewBundle['views'][number] {
  const parsed = articlesViewConfigSchema.safeParse(view.config);
  return {
    id: view.id,
    name: view.name,
    // If the stored config is malformed (manual DB edit, schema drift), fall
    // back to defaults rather than rejecting the whole bundle.
    config: parsed.success ? parsed.data : articlesViewConfigSchema.parse({}),
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
  };
}

export async function getArticlesViewBundle(userId: string): Promise<ArticlesViewBundle> {
  const settings = await ensureUserSettings(userId);
  const rows = await listTableViews(settings.id, TABLE_VIEW_SCOPE_ARTICLES);
  return {
    activeViewId: settings.activeTableViewId,
    views: rows.map(toArticlesView),
  };
}

export async function createArticlesView(
  userId: string,
  data: { name: string; config: unknown },
): Promise<ArticlesViewBundle['views'][number]> {
  const settings = await ensureUserSettings(userId);
  const config = articlesViewConfigSchema.parse(data.config);
  const row = await repoCreate({
    userSettingsId: settings.id,
    name: data.name,
    scope: TABLE_VIEW_SCOPE_ARTICLES,
    config,
  });
  return toArticlesView(row);
}

async function loadOwnView(userId: string, viewId: string): Promise<DbTableView> {
  const view = await findTableViewById(viewId);
  if (!view) throw new ManageTableViewError('NOT_FOUND', 'Table view not found');
  const settings = await ensureUserSettings(userId);
  if (view.userSettingsId !== settings.id) {
    throw new ManageTableViewError('FORBIDDEN', 'Not your table view');
  }
  return view;
}

export async function updateArticlesView(
  userId: string,
  viewId: string,
  data: { name?: string; config?: unknown },
): Promise<ArticlesViewBundle['views'][number]> {
  await loadOwnView(userId, viewId);
  const parsedConfig =
    data.config !== undefined ? articlesViewConfigSchema.parse(data.config) : undefined;
  const row = await repoUpdate(viewId, {
    name: data.name,
    config: parsedConfig,
  });
  return toArticlesView(row);
}

export async function deleteArticlesView(userId: string, viewId: string): Promise<void> {
  const view = await loadOwnView(userId, viewId);
  await repoDelete(view.id);
  // The activeTableViewId FK has ON DELETE SET NULL, so no extra cleanup
  // is required — the active pointer falls back to "default view" naturally.
}

export async function setActiveArticlesView(
  userId: string,
  viewId: string | null,
): Promise<void> {
  await ensureUserSettings(userId);
  if (viewId !== null) {
    await loadOwnView(userId, viewId);
  }
  await repoSetActive(userId, viewId);
}

export class ManageTableViewError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'FORBIDDEN',
    message: string,
  ) {
    super(message);
    this.name = 'ManageTableViewError';
  }
}
