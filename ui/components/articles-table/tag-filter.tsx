'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FilterPopoverShell } from './filter-popover-shell';

interface TagItem {
  id: string;
  text: string;
}

interface Props {
  apiUrl: string; // e.g. '/api/topics'
  selected: TagItem[];
  open: boolean;
  onClose: () => void;
  onChange: (next: TagItem[]) => void;
  placeholder: string;
}

/**
 * Multi-select filter for topics/sages. The server endpoint returns at most
 * 50 matches per query, so we always search server-side instead of preloading.
 * Selected chips persist regardless of the current search term.
 */
export function TagFilterPopover({ apiUrl, selected, open, onClose, onChange, placeholder }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
        const res = await fetch(`${apiUrl}${qs}`);
        if (!res.ok) return;
        const json = await res.json();
        setResults((json.data ?? []) as TagItem[]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [apiUrl, search, open]);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  // Show selected chips first, then unselected search results.
  const display: { item: TagItem; isSelected: boolean }[] = useMemo(() => {
    const seenIds = new Set<string>();
    const out: { item: TagItem; isSelected: boolean }[] = [];
    for (const s of selected) {
      out.push({ item: s, isSelected: true });
      seenIds.add(s.id);
    }
    for (const r of results) {
      if (seenIds.has(r.id)) continue;
      out.push({ item: r, isSelected: false });
    }
    return out;
  }, [selected, results]);

  function toggle(item: TagItem) {
    if (selectedIds.has(item.id)) {
      onChange(selected.filter((s) => s.id !== item.id));
    } else {
      onChange([...selected, item]);
    }
  }

  return (
    <FilterPopoverShell open={open} onClose={onClose}>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex justify-end text-xs">
          <button
            type="button"
            className="text-gray-600 hover:underline"
            onClick={() => onChange([])}
            disabled={selected.length === 0}
          >
            נקה
          </button>
        </div>
        <div className="max-h-56 overflow-y-auto rounded border border-gray-100">
          {loading && display.length === 0 ? (
            <p className="px-2 py-3 text-xs text-gray-500">טוען...</p>
          ) : display.length === 0 ? (
            <p className="px-2 py-3 text-xs text-gray-500">לא נמצאו תוצאות</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {display.map(({ item, isSelected }) => (
                <li key={item.id}>
                  <label className="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(item)}
                    />
                    <span>{item.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </FilterPopoverShell>
  );
}
