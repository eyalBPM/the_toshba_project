'use client';

import { useState, useEffect, useRef } from 'react';

export interface TopicResult {
  id: string;
  text: string;
}

export function useTopicsSearch(query: string): { results: TopicResult[]; loading: boolean } {
  const [results, setResults] = useState<TopicResult[]>([]);
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
        const res = await fetch(`/api/topics?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          setResults((json.data ?? []) as TopicResult[]);
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
