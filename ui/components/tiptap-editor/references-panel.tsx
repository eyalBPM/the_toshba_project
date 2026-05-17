'use client';

import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { insertReference } from '@/ui/extensions/reference-mark';
import { useArticlesSearch } from '@/ui/hooks/use-articles-search';
import type { ReferenceTag } from '@/ui/hooks/use-editor-state';
import { useListNavigation } from '@/ui/hooks/use-list-navigation';
import { completePrefix } from '@/lib/complete-prefix';

interface ReferencesPanelProps {
  editor: Editor;
  onAbstractAdd?: (tag: ReferenceTag) => void;
  onClose: () => void;
}

export function ReferencesPanel({ editor, onAbstractAdd, onClose }: ReferencesPanelProps) {
  const [query, setQuery] = useState('');
  const { results, loading } = useArticlesSearch(query);
  const panelRef = useRef<HTMLDivElement>(null);
  const nav = useListNavigation(results, (a) => a.id);

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

  function handleSelect(article: (typeof results)[number]) {
    insertReference(editor, article, selectedText);
    onClose();
  }

  function handleAbstract(article: (typeof results)[number]) {
    onAbstractAdd?.({ articleId: article.id, slug: article.slug, title: article.title });
    onClose();
  }

  return (
    <div
      ref={panelRef}
      className="absolute z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white shadow-lg"
      dir="rtl"
    >
      <div className="border-b border-gray-100 px-3 py-2">
        <p className="text-xs font-medium text-gray-600">הפניה למאמר</p>
      </div>
      <div className="p-2">
        <input
          autoFocus
          type="text"
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="חיפוש שם מאמר..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
              return;
            }
            if (nav.handleKeyDown(e)) return;
            if (e.key === 'ArrowLeft' && nav.activeItem) {
              const input = e.currentTarget;
              if (
                input.selectionStart === input.value.length &&
                input.selectionEnd === input.value.length
              ) {
                const next = completePrefix(query, nav.activeItem.title);
                if (next !== null) {
                  e.preventDefault();
                  setQuery(next);
                }
              }
              return;
            }
            if (e.key === 'Enter' && nav.activeItem) {
              e.preventDefault();
              handleSelect(nav.activeItem);
            }
          }}
        />
      </div>

      <div className="max-h-56 overflow-y-auto">
        {loading && (
          <p className="px-3 py-2 text-xs text-gray-400">מחפש...</p>
        )}
        {results.map((article, index) => (
          <div
            key={article.id}
            ref={nav.setItemRef(article.id)}
            className={`flex items-center justify-between gap-1 px-3 py-2 ${
              index === nav.activeIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
            }`}
            onMouseEnter={() => nav.setActiveIndex(index)}
          >
            <button
              type="button"
              className="flex-1 text-right text-sm text-gray-700"
              onClick={() => handleSelect(article)}
            >
              {article.title}
            </button>
            {onAbstractAdd && (
              <button
                type="button"
                className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 hover:bg-blue-100 hover:text-blue-700"
                title="הוסף לרשימה בלבד (ללא הכנסה לגוף)"
                onClick={() => handleAbstract(article)}
              >
                רקע
              </button>
            )}
          </div>
        ))}
        {!loading && query.trim() && results.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">לא נמצאו מאמרים</p>
        )}
        {!query.trim() && (
          <p className="px-3 py-2 text-xs text-gray-400">הקלד שם מאמר לחיפוש</p>
        )}
      </div>
    </div>
  );
}
