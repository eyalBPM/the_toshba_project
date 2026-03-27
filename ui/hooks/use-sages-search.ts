'use client';

import { useState, useEffect, useRef } from 'react';

export interface SageResult {
  id: string;
  text: string;
}

export function useSagesSearch(query: string): { results: SageResult[]; loading: boolean } {
  const [results, setResults] = useState<SageResult[]>([]);
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
        const res = await fetch(`/api/sages?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = await res.json();
          setResults((json.data ?? []) as SageResult[]);
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
