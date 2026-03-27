'use client';

import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { insertSourceCitation, getCitationList } from '@/ui/extensions/source-citation';
import type { DbSourceItem } from '@/ui/hooks/use-sources';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';

interface SourcesPanelProps {
  editor: Editor;
  sources: DbSourceItem[];
  revisionId: string;
  onAbstractAdd?: (tag: SnapshotTag) => void;
  onClose: () => void;
}

export function SourcesPanel({
  editor,
  sources,
  revisionId,
  onAbstractAdd,
  onClose,
}: SourcesPanelProps) {
  const [query, setQuery] = useState('');
  const [showMissing, setShowMissing] = useState(false);
  const [missingText, setMissingText] = useState('');
  const [submittingMissing, setSubmittingMissing] = useState(false);
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

  const filtered = query.trim()
    ? sources.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase()) ||
        s.book.toLowerCase().includes(query.toLowerCase()),
      )
    : sources;

  function handleSelect(source: DbSourceItem) {
    insertSourceCitation(editor, source.id);
    onClose();
  }

  function handleAbstract(source: DbSourceItem) {
    onAbstractAdd?.({ id: source.id, text: source.label });
    onClose();
  }

  async function handleMissingSubmit() {
    if (!missingText.trim()) return;
    setSubmittingMissing(true);
    try {
      // Compute citation number based on current document state
      const citations = getCitationList(editor.state.doc);
      const citationNumber = citations.length + 1;

      // Insert into editor first
      insertSourceCitation(editor, 'missing', missingText.trim());

      // Then record in DB
      await fetch(`/api/revisions/${revisionId}/missing-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citationNumber, text: missingText.trim() }),
      });

      onClose();
    } finally {
      setSubmittingMissing(false);
    }
  }

  return (
    <div
      ref={panelRef}
      className="absolute z-50 mt-1 w-80 rounded-lg border border-gray-200 bg-white shadow-lg"
      dir="rtl"
    >
      <div className="border-b border-gray-100 px-3 py-2">
        <p className="text-xs font-medium text-gray-600">הוסף מקור</p>
      </div>

      {!showMissing ? (
        <>
          <div className="p-2">
            <input
              autoFocus
              type="text"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="חיפוש מקור..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
              }}
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filtered.slice(0, 50).map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between gap-1 px-3 py-1.5 hover:bg-gray-50"
              >
                <button
                  type="button"
                  className="flex-1 text-right text-sm text-gray-700"
                  onClick={() => handleSelect(source)}
                >
                  <span className="font-medium">{source.label}</span>
                  <span className="mr-1 text-xs text-gray-400">({source.book})</span>
                </button>
                {onAbstractAdd && (
                  <button
                    type="button"
                    className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 hover:bg-amber-100 hover:text-amber-700"
                    title="הוסף לרשימה בלבד"
                    onClick={() => handleAbstract(source)}
                  >
                    רקע
                  </button>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">לא נמצאו מקורות</p>
            )}
          </div>

          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              className="w-full rounded bg-gray-50 px-2 py-1.5 text-right text-xs text-gray-600 hover:bg-gray-100"
              onClick={() => setShowMissing(true)}
            >
              מקור חסר
            </button>
          </div>
        </>
      ) : (
        <div className="p-3 space-y-2">
          <p className="text-xs text-gray-600">תאר את המקור החסר:</p>
          <textarea
            autoFocus
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            rows={3}
            placeholder="תיאור המקור..."
            value={missingText}
            onChange={(e) => setMissingText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded bg-amber-600 px-2 py-1.5 text-xs text-white hover:bg-amber-700 disabled:opacity-50"
              onClick={handleMissingSubmit}
              disabled={submittingMissing || !missingText.trim()}
            >
              {submittingMissing ? 'מוסיף...' : 'הוסף'}
            </button>
            <button
              type="button"
              className="rounded bg-gray-100 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-200"
              onClick={() => setShowMissing(false)}
            >
              חזרה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
