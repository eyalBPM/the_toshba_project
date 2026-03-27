'use client';

import { useState, useEffect } from 'react';

// Module-level cache avoids re-fetching on repeated hover
const cache = new Map<string, string>();

export function useSefariaText(
  path: string | null,
  enabled: boolean,
): { text: string | null; loading: boolean } {
  const [text, setText] = useState<string | null>(path ? (cache.get(path) ?? null) : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !path) return;
    if (cache.has(path)) {
      setText(cache.get(path)!);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(path)}?lang=he&context=0`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        // Sefaria returns `he` as an array of strings or a string
        const heArr = data?.he;
        const heText = Array.isArray(heArr) ? heArr.join(' ') : (heArr ?? '');
        const cleaned = String(heText).replace(/<[^>]+>/g, '').trim();
        cache.set(path, cleaned);
        setText(cleaned);
      })
      .catch(() => {
        if (!cancelled) setText(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, enabled]);

  return { text, loading };
}
