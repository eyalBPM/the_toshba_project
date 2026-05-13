'use client';

import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { insertSage } from '@/ui/extensions/sage-mark';
import { useSagesSearch } from '@/ui/hooks/use-sages-search';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';
import { useListNavigation } from '@/ui/hooks/use-list-navigation';
import { completePrefix } from '@/lib/complete-prefix';

interface SagesPanelProps {
  editor: Editor;
  onAbstractAdd?: (tag: SnapshotTag) => void;
  onClose: () => void;
}

export function SagesPanel({ editor, onAbstractAdd, onClose }: SagesPanelProps) {
  const [query, setQuery] = useState('');
  const { results, loading } = useSagesSearch(query);
  const [creating, setCreating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const nav = useListNavigation(results, (s) => s.id);

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

  async function createSage(): Promise<SnapshotTag | null> {
    const res = await fetch('/api/sages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query.trim() }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as SnapshotTag;
  }

  async function handleCreate() {
    if (!query.trim() || creating) return;
    setCreating(true);
    try {
      const tag = await createSage();
      if (tag) {
        insertSage(editor, tag.id, tag.text, selectedText);
        onClose();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateAbstract() {
    if (!query.trim() || creating || !onAbstractAdd) return;
    setCreating(true);
    try {
      const tag = await createSage();
      if (tag) {
        onAbstractAdd(tag);
        onClose();
      }
    } finally {
      setCreating(false);
    }
  }

  function handleSelect(sage: SnapshotTag) {
    insertSage(editor, sage.id, sage.text, selectedText);
    onClose();
  }

  function handleAbstract(sage: SnapshotTag) {
    onAbstractAdd?.(sage);
    onClose();
  }

  return (
    <div
      ref={panelRef}
      className="absolute z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
      dir="rtl"
    >
      <div className="p-2">
        <input
          autoFocus
          type="text"
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="חיפוש או יצירת חכם..."
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
                const next = completePrefix(query, nav.activeItem.text);
                if (next !== null) {
                  e.preventDefault();
                  setQuery(next);
                }
              }
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (nav.activeItem) {
                handleSelect(nav.activeItem);
              } else {
                handleCreate();
              }
            }
          }}
        />
      </div>

      <div className="max-h-48 overflow-y-auto">
        {loading && (
          <p className="px-3 py-2 text-xs text-gray-400">מחפש...</p>
        )}
        {results.map((sage, index) => (
          <div
            key={sage.id}
            ref={nav.setItemRef(sage.id)}
            className={`flex items-center justify-between gap-1 px-3 py-1.5 ${
              index === nav.activeIndex ? 'bg-green-50' : 'hover:bg-gray-50'
            }`}
            onMouseEnter={() => nav.setActiveIndex(index)}
          >
            <button
              type="button"
              className="flex-1 text-right text-sm text-gray-700"
              onClick={() => handleSelect(sage)}
            >
              {sage.text}
            </button>
            {onAbstractAdd && (
              <button
                type="button"
                className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 hover:bg-green-100 hover:text-green-700"
                title="הוסף לרשימה בלבד (ללא הכנסה לגוף)"
                onClick={() => handleAbstract(sage)}
              >
                רקע
              </button>
            )}
          </div>
        ))}
        {!loading && query.trim() && results.length === 0 && (
          <div className="flex items-stretch">
            <button
              type="button"
              className="flex-1 px-3 py-2 text-right text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'יוצר...' : `צור: "${query.trim()}"`}
            </button>
            {onAbstractAdd && (
              <button
                type="button"
                className="shrink-0 border-r border-gray-100 px-2 py-2 text-xs text-gray-500 hover:bg-green-100 hover:text-green-700 disabled:opacity-50"
                title='צור והוסף לרשימה בלבד (ללא הכנסה לגוף)'
                onClick={handleCreateAbstract}
                disabled={creating}
              >
                רקע
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
