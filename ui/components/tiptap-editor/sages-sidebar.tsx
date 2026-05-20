'use client';

import type { Editor } from '@tiptap/core';
import { removeSageMark } from '@/ui/extensions/sage-mark';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';

interface SagesSidebarProps {
  editor?: Editor | null;
  bodySages: SnapshotTag[];
  abstractSages: SnapshotTag[];
  onDeleteAbstract?: (id: string) => void;
  readOnly?: boolean;
}

export function SagesSidebar({
  editor,
  bodySages,
  abstractSages,
  onDeleteAbstract,
  readOnly = false,
}: SagesSidebarProps) {
  const allSages = [
    ...bodySages.map((s) => ({ ...s, abstract: false })),
    ...abstractSages
      .filter((s) => !bodySages.find((b) => b.id === s.id))
      .map((s) => ({ ...s, abstract: true })),
  ];

  if (allSages.length === 0) return null;

  function handleDelete(sageId: string, isAbstract: boolean) {
    if (!isAbstract && editor) {
      removeSageMark(editor, sageId);
    }
    onDeleteAbstract?.(sageId);
  }

  return (
    <div dir="rtl">
      <p className="mb-1 text-xs font-medium text-gray-500">חכמים</p>
      <div className="space-y-1">
        {allSages.map((sage) => (
          <div
            key={sage.id}
            className="flex items-center justify-between gap-1 rounded bg-green-50 px-2 py-0.5"
          >
            <span className="text-xs text-green-800">{sage.text}</span>
            <div className="flex items-center gap-1">
              {sage.abstract && (
                <span className="text-xs text-gray-400">[רקע]</span>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleDelete(sage.id, sage.abstract)}
                  className="text-green-400 hover:text-red-500 text-xs"
                  title="הסר חכם"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
