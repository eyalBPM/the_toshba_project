'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ArticlesViewConfig } from '@/domain/articles-list/view-config';

export interface ArticlesView {
  id: string;
  name: string;
  config: ArticlesViewConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlesViewBundle {
  activeViewId: string | null;
  views: ArticlesView[];
}

interface UseBundle {
  bundle: ArticlesViewBundle | null;
  loading: boolean;
  // Manual refetch — used by the view switcher after mutations resolve.
  reload: () => Promise<void>;
}

/**
 * Fetches the current user's articles-list view bundle. Returns `null` for
 * unauthenticated users (the API responds 401 and we degrade to default view).
 */
export function useArticlesViewBundle(enabled: boolean): UseBundle {
  const [bundle, setBundle] = useState<ArticlesViewBundle | null>(null);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings/articles-view');
      if (!res.ok) {
        setBundle(null);
        return;
      }
      const json = await res.json();
      setBundle(json.data as ArticlesViewBundle);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setBundle(null);
      setLoading(false);
      return;
    }
    void reload();
  }, [enabled, reload]);

  return { bundle, loading, reload };
}
