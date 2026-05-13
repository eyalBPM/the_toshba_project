'use client';

import type { Editor } from '@tiptap/core';
import { removeSourceCitation } from '@/ui/extensions/source-citation';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';

interface SourcesSidebarProps {
  editor: Editor | null;
  bodySources: { id: string; label: string }[];
  abstractSources: SnapshotTag[];
  onDeleteAbstract: (id: string) => void;
}

export function SourcesSidebar({
  editor,
  bodySources,
  abstractSources,
  onDeleteAbstract,
}: SourcesSidebarProps) {
  const allSources = [
    ...bodySources.map((s) => ({ id: s.id, label: s.label, abstract: false })),
    ...abstractSources
      .filter((s) => !bodySources.find((b) => b.id === s.id))
      .map((s) => ({ id: s.id, label: s.text, abstract: true })),
  ];

  if (allSources.length === 0) return null;

  function handleDelete(sourceId: string, isAbstract: boolean) {
    if (!isAbstract && editor) {
      removeSourceCitation(editor, sourceId);
    }
    onDeleteAbstract(sourceId);
  }

  return (
    <div dir="rtl">
      <p className="mb-1 text-xs font-medium text-gray-500">מקורות</p>
      <div className="space-y-1">
        {allSources.map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between gap-1 rounded bg-amber-50 px-2 py-0.5"
          >
            <span className="text-xs text-amber-800">{source.label}</span>
            <div className="flex items-center gap-1">
              {source.abstract && (
                <span className="text-xs text-gray-400">[רקע]</span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(source.id, source.abstract)}
                className="text-amber-400 hover:text-red-500 text-xs"
                title="הסר מקור"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
