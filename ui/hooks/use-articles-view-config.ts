'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_ARTICLES_VIEW_CONFIG,
  type ArticlesViewConfig,
} from '@/domain/articles-list/view-config';
import type { ArticlesView } from './use-articles-view-bundle';

interface UseConfig {
  config: ArticlesViewConfig;
  setConfig: (next: ArticlesViewConfig) => void;
  // True when the user is on the default view and has made unsaved edits.
  // Hidden in the UI until the user starts changing things — that's the cue
  // to expose "Save as view".
  isDirtyDefault: boolean;
  resetToDefault: () => void;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Manages the active table view's config in local state. When the active
 * view comes from the user's saved list, mutations debounce-PATCH the server.
 * When the active view is the synthetic "default", mutations stay client-side
 * and surface a dirty flag so the UI can offer "save as".
 */
export function useArticlesViewConfig(opts: {
  activeViewId: string | null;
  views: ArticlesView[];
}): UseConfig {
  const { activeViewId, views } = opts;

  const activeView = useMemo(
    () => views.find((v) => v.id === activeViewId) ?? null,
    [activeViewId, views],
  );

  const baseConfig = useMemo(
    () => activeView?.config ?? DEFAULT_ARTICLES_VIEW_CONFIG,
    [activeView],
  );

  const [config, setConfigState] = useState<ArticlesViewConfig>(baseConfig);

  // Whenever the active view changes (switch / re-fetch / reset), snap local
  // state to that view's config.
  useEffect(() => {
    setConfigState(baseConfig);
  }, [baseConfig]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const setConfig = useCallback(
    (next: ArticlesViewConfig) => {
      setConfigState(next);
      // Auto-save only if a real view is active. Default view is UI-only.
      if (!activeViewId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetch(`/api/user/table-views/${activeViewId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: next }),
        }).catch(() => {});
      }, 500);
    },
    [activeViewId],
  );

  const resetToDefault = useCallback(() => {
    setConfigState(DEFAULT_ARTICLES_VIEW_CONFIG);
  }, []);

  const isDirtyDefault = activeViewId === null && !deepEqual(config, DEFAULT_ARTICLES_VIEW_CONFIG);

  return { config, setConfig, isDirtyDefault, resetToDefault };
}
