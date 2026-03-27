'use client';

import type { Editor } from '@tiptap/core';
import { removeSageMark } from '@/ui/extensions/sage-mark';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';

interface SagesSidebarProps {
  editor: Editor | null;
  bodySages: SnapshotTag[];
}

export function SagesSidebar({ editor, bodySages }: SagesSidebarProps) {
  if (bodySages.length === 0) return null;

  function handleDelete(sageId: string) {
    if (editor) removeSageMark(editor, sageId);
  }

  return (
    <div dir="rtl">
      <p className="mb-1 text-xs font-medium text-gray-500">חכמים</p>
      <div className="space-y-1">
        {bodySages.map((sage) => (
          <div
            key={sage.id}
            className="flex items-center justify-between gap-1 rounded bg-green-50 px-2 py-0.5"
          >
            <span className="text-xs text-green-800">{sage.text}</span>
            <button
              type="button"
              onClick={() => handleDelete(sage.id)}
              className="text-green-400 hover:text-red-500 text-xs"
              title="הסר חכם"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
