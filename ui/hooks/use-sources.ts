'use client';

import { useState, useEffect } from 'react';

export interface DbSourceItem {
  id: string;
  book: string;
  label: string;
  path: string;
  index: number;
}

// Module-level cache — fetched once per page lifecycle
let cachedSources: DbSourceItem[] | null = null;
const listeners: Array<(sources: DbSourceItem[]) => void> = [];

function notifyListeners(sources: DbSourceItem[]) {
  listeners.forEach((fn) => fn(sources));
}

async function fetchSources(): Promise<DbSourceItem[]> {
  if (cachedSources) return cachedSources;
  const res = await fetch('/api/sources');
  if (!res.ok) return [];
  const json = await res.json();
  const sources = (json.data ?? []) as DbSourceItem[];
  cachedSources = sources;
  notifyListeners(sources);
  return sources;
}

export function useSources(): DbSourceItem[] {
  const [sources, setSources] = useState<DbSourceItem[]>(cachedSources ?? []);

  useEffect(() => {
    if (cachedSources) {
      setSources(cachedSources);
      return;
    }
    const handler = (s: DbSourceItem[]) => setSources(s);
    listeners.push(handler);
    fetchSources().catch(() => {});
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  return sources;
}
