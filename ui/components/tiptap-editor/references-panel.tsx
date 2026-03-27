'use client';

import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { insertReference } from '@/ui/extensions/reference-mark';
import { useArticlesSearch } from '@/ui/hooks/use-articles-search';

interface ReferencesPanelProps {
  editor: Editor;
  onClose: () => void;
}

export function ReferencesPanel({ editor, onClose }: ReferencesPanelProps) {
  const [query, setQuery] = useState('');
  const { results, loading } = useArticlesSearch(query);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const { from, to, empty } = editor.state.selection;
  const selectedText = empty
    ? undefined
    : editor.state.doc.textBetween(from, to);

  return (
    <div
      ref={panelRef}
      className="absolute z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white shadow-lg"
      dir="rtl"
    >
      <div className="border-b border-gray-100 px-3 py-2">
        <p className="text-xs font-medium text-gray-600">הפניה לערך</p>
      </div>
      <div className="p-2">
        <input
          autoFocus
          type="text"
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="חיפוש שם ערך..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
        />
      </div>

      <div className="max-h-56 overflow-y-auto">
        {loading && (
          <p className="px-3 py-2 text-xs text-gray-400">מחפש...</p>
        )}
        {results.map((article) => (
          <button
            key={article.id}
            type="button"
            className="w-full px-3 py-2 text-right text-sm text-gray-700 hover:bg-blue-50"
            onClick={() => {
              insertReference(editor, article, selectedText);
              onClose();
            }}
          >
            {article.title}
          </button>
        ))}
        {!loading && query.trim() && results.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">לא נמצאו ערכים</p>
        )}
        {!query.trim() && (
          <p className="px-3 py-2 text-xs text-gray-400">הקלד שם ערך לחיפוש</p>
        )}
      </div>
    </div>
  );
}
