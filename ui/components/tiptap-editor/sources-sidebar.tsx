'use client';

import type { Editor } from '@tiptap/core';
import { removeSourceCitation } from '@/ui/extensions/source-citation';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';
import { SourceTooltip } from './source-tooltip';

export interface SidebarBodySource {
  id: string;
  label: string;
  number?: number;
  path?: string;
}

interface SourcesSidebarProps {
  editor?: Editor | null;
  bodySources: SidebarBodySource[];
  abstractSources: SnapshotTag[];
  onDeleteAbstract?: (id: string) => void;
  readOnly?: boolean;
}

export function SourcesSidebar({
  editor,
  bodySources,
  abstractSources,
  onDeleteAbstract,
  readOnly = false,
}: SourcesSidebarProps) {
  const dedupedAbstract = abstractSources.filter(
    (s) => !bodySources.find((b) => b.id === s.id),
  );

  if (bodySources.length === 0 && dedupedAbstract.length === 0) return null;

  function handleBodyDelete(sourceId: string) {
    if (editor) removeSourceCitation(editor, sourceId);
    onDeleteAbstract?.(sourceId);
  }

  function handleAbstractDelete(sourceId: string) {
    onDeleteAbstract?.(sourceId);
  }

  return (
    <div className="space-y-4" dir="rtl">
      {bodySources.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">מקורות</p>
          <div className="space-y-1">
            {bodySources.map((source) => {
              const labelEl = (
                <span className="text-xs text-amber-800">
                  {source.number !== undefined && (
                    <span className="ml-1 font-medium text-amber-700">[{source.number}]</span>
                  )}
                  {source.label}
                </span>
              );
              return (
                <div
                  key={source.id}
                  className="flex items-center justify-between gap-1 rounded bg-amber-50 px-2 py-0.5"
                >
                  {source.path ? (
                    <SourceTooltip path={source.path}>{labelEl}</SourceTooltip>
                  ) : (
                    labelEl
                  )}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleBodyDelete(source.id)}
                      className="text-amber-400 hover:text-red-500 text-xs"
                      title="הסר מקור"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dedupedAbstract.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">מקורות נוספים</p>
          <div className="space-y-1">
            {dedupedAbstract.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between gap-1 rounded bg-amber-50 px-2 py-0.5"
              >
                <span className="text-xs text-amber-800">{source.text}</span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleAbstractDelete(source.id)}
                    className="text-amber-400 hover:text-red-500 text-xs"
                    title="הסר מקור"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
