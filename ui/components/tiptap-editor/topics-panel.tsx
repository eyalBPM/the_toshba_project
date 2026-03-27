'use client';

import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { insertTopic } from '@/ui/extensions/topic-mark';
import { useTopicsSearch } from '@/ui/hooks/use-topics-search';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';

interface TopicsPanelProps {
  editor: Editor;
  onAbstractAdd?: (tag: SnapshotTag) => void;
  onClose: () => void;
}

export function TopicsPanel({ editor, onAbstractAdd, onClose }: TopicsPanelProps) {
  const [query, setQuery] = useState('');
  const { results, loading } = useTopicsSearch(query);
  const [creating, setCreating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        const tag = json.data as SnapshotTag;
        insertTopic(editor, tag.id, tag.text, selectedText);
        onClose();
      }
    } finally {
      setCreating(false);
    }
  }

  function handleSelect(topic: SnapshotTag) {
    insertTopic(editor, topic.id, topic.text, selectedText);
    onClose();
  }

  function handleAbstract(topic: SnapshotTag) {
    onAbstractAdd?.(topic);
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
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="חיפוש או יצירת נושא..."
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
        {results.map((topic) => (
          <div
            key={topic.id}
            className="flex items-center justify-between gap-1 px-3 py-1.5 hover:bg-gray-50"
          >
            <button
              type="button"
              className="flex-1 text-right text-sm text-gray-700"
              onClick={() => handleSelect(topic)}
            >
              {topic.text}
            </button>
            {onAbstractAdd && (
              <button
                type="button"
                className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 hover:bg-blue-100 hover:text-blue-700"
                title="הוסף לרשימה בלבד (ללא הכנסה לגוף)"
                onClick={() => handleAbstract(topic)}
              >
                רקע
              </button>
            )}
          </div>
        ))}
        {!loading && query.trim() && results.length === 0 && (
          <button
            type="button"
            className="w-full px-3 py-2 text-right text-sm text-blue-600 hover:bg-blue-50"
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
