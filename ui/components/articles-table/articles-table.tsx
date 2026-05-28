'use client';

import { useMemo } from 'react';
import { useInfiniteList } from '@/ui/hooks/use-infinite-list';
import { useArticlesViewBundle } from '@/ui/hooks/use-articles-view-bundle';
import { useArticlesViewConfig } from '@/ui/hooks/use-articles-view-config';
import { InfiniteScrollTrigger } from '@/ui/components/infinite-scroll-trigger';
import { ArticlesSearchBar } from './search-bar';
import { ArticlesTableHeader } from './table-header';
import { ArticlesTableRows } from './table-rows';
import { ArticlesViewSwitcher } from './view-switcher';
import type { ArticleRow } from './table-types';

interface Props {
  // Server-known auth state. The bundle is fetched client-side only when the
  // user is logged in; anonymous visitors stick with the default view and
  // skip the auth-only API call entirely.
  isAuthenticated: boolean;
}

function buildParams(config: ReturnType<typeof useArticlesViewConfig>['config']) {
  const p: Record<string, string> = { limit: '20' };
  if (config.search.text.trim()) p.search = config.search.text.trim();
  if (config.search.includeContent) p.searchInContent = 'true';
  p.sort = config.sort.col;
  p.dir = config.sort.dir;
  if (config.filters.books.length > 0) p.books = config.filters.books.join(',');
  if (config.filters.topics.length > 0) p.topicIds = config.filters.topics.map((t) => t.id).join(',');
  if (config.filters.sages.length > 0) p.sageIds = config.filters.sages.map((s) => s.id).join(',');
  return p;
}

export function ArticlesTable({ isAuthenticated }: Props) {
  const { bundle, loading: bundleLoading, reload } = useArticlesViewBundle(isAuthenticated);

  const views = bundle?.views ?? [];
  const activeViewId = bundle?.activeViewId ?? null;
  const { config, setConfig, isDirtyDefault, resetToDefault } = useArticlesViewConfig({
    activeViewId,
    views,
  });

  const params = useMemo(() => buildParams(config), [config]);

  const { items, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteList<ArticleRow>({
      url: '/api/articles',
      queryKey: ['articles-table'],
      params,
    });

  return (
    <div dir="rtl" className="flex flex-col gap-3">
      {isAuthenticated && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {bundleLoading && !bundle ? (
            <span className="text-xs text-gray-400">טוען מבטים...</span>
          ) : (
            <ArticlesViewSwitcher
              activeViewId={activeViewId}
              views={views}
              currentConfig={config}
              isDirtyDefault={isDirtyDefault}
              onAfterMutation={reload}
              onResetToDefault={resetToDefault}
            />
          )}
        </div>
      )}

      <ArticlesSearchBar
        text={config.search.text}
        includeContent={config.search.includeContent}
        onChange={(next) => setConfig({ ...config, search: next })}
      />

      {isLoading && items.length === 0 ? (
        <p className="text-sm text-gray-400">טוען...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <ArticlesTableHeader config={config} onChange={setConfig} />
            {items.length === 0 ? (
              <tbody>
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={5}>
                    לא נמצאו מאמרים
                  </td>
                </tr>
              </tbody>
            ) : (
              <ArticlesTableRows articles={items} />
            )}
          </table>
        </div>
      )}

      <InfiniteScrollTrigger
        onTrigger={() => fetchNextPage()}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}
