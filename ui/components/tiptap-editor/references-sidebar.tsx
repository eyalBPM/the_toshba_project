'use client';

import type { Editor } from '@tiptap/core';
import { removeReferenceMark } from '@/ui/extensions/reference-mark';
import type { ReferenceTag } from '@/ui/hooks/use-editor-state';

interface ReferencesSidebarProps {
  editor: Editor | null;
  bodyReferences: ReferenceTag[];
  abstractReferences: ReferenceTag[];
  onDeleteAbstract: (articleId: string) => void;
}

export function ReferencesSidebar({
  editor,
  bodyReferences,
  abstractReferences,
  onDeleteAbstract,
}: ReferencesSidebarProps) {
  const allRefs = [
    ...bodyReferences.map((r) => ({ ...r, abstract: false })),
    ...abstractReferences
      .filter((r) => !bodyReferences.find((b) => b.articleId === r.articleId))
      .map((r) => ({ ...r, abstract: true })),
  ];

  if (allRefs.length === 0) return null;

  function handleDelete(articleId: string, isAbstract: boolean) {
    if (!isAbstract && editor) {
      removeReferenceMark(editor, articleId);
    }
    onDeleteAbstract(articleId);
  }

  return (
    <div dir="rtl">
      <p className="mb-1 text-xs font-medium text-gray-500">הפניות</p>
      <div className="space-y-1">
        {allRefs.map((ref) => (
          <div
            key={ref.articleId}
            className="flex items-center justify-between gap-1 rounded bg-indigo-50 px-2 py-0.5"
          >
            <span className="text-xs text-indigo-800">{ref.title}</span>
            <div className="flex items-center gap-1">
              {ref.abstract && (
                <span className="text-xs text-gray-400">[רקע]</span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(ref.articleId, ref.abstract)}
                className="text-indigo-400 hover:text-red-500 text-xs"
                title="הסר הפניה"
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
