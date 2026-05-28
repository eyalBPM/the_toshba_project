'use client';

import { useEffect, useState } from 'react';

interface Props {
  text: string;
  includeContent: boolean;
  onChange: (next: { text: string; includeContent: boolean }) => void;
}

export function ArticlesSearchBar({ text, includeContent, onChange }: Props) {
  // Local input state to keep typing snappy; commit upstream only after a
  // short idle so we don't refetch the list on every keystroke.
  const [draft, setDraft] = useState(text);

  useEffect(() => setDraft(text), [text]);

  useEffect(() => {
    if (draft === text) return;
    const id = setTimeout(() => onChange({ text: draft, includeContent }), 300);
    return () => clearTimeout(id);
  }, [draft, text, includeContent, onChange]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="חיפוש מאמרים..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
        <input
          type="checkbox"
          checked={includeContent}
          onChange={(e) => onChange({ text, includeContent: e.target.checked })}
        />
        כולל תוכן
      </label>
    </div>
  );
}
