'use client';

import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { insertSage } from '@/ui/extensions/sage-mark';
import { useSagesSearch } from '@/ui/hooks/use-sages-search';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';

interface SagesPanelProps {
  editor: Editor;
  onClose: () => void;
}

export function SagesPanel({ editor, onClose }: SagesPanelProps) {
  const [query, setQuery] = useState('');
  const { results, loading } = useSagesSearch(query);
  const [creating, setCreating] = useState(false);
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

  async function handleCreate() {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/sages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        const tag = json.data as SnapshotTag;
        insertSage(editor, tag.id, tag.text, selectedText);
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
            if (e.key === 'Enter') handleCreate();
            if (e.key === 'Escape') onClose();
          }}
        />
      </div>

      <div className="max-h-48 overflow-y-auto">
        {loading && (
          <p className="px-3 py-2 text-xs text-gray-400">מחפש...</p>
        )}
        {results.map((sage) => (
          <button
            key={sage.id}
            type="button"
            className="w-full px-3 py-1.5 text-right text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => handleSelect(sage)}
          >
            {sage.text}
          </button>
        ))}
        {!loading && query.trim() && results.length === 0 && (
          <button
            type="button"
            className="w-full px-3 py-2 text-right text-sm text-green-600 hover:bg-green-50"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'יוצר...' : `צור: "${query.trim()}"`}
          </button>
        )}
      </div>
    </div>
  );
}
