'use client';

import { useState, useEffect, useRef } from 'react';

export interface ArticleResult {
  id: string;
  title: string;
  slug: string;
}

export function useArticlesSearch(query: string): { results: ArticleResult[]; loading: boolean } {
  const [results, setResults] = useState<ArticleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/articles?search=${encodeURIComponent(query)}&limit=20`);
        if (res.ok) {
          const json = await res.json();
          setResults((json.data ?? []) as ArticleResult[]);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return { results, loading };
}
