'use client';

import type { Editor } from '@tiptap/core';
import { removeTopicMark } from '@/ui/extensions/topic-mark';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';

interface TopicsSidebarProps {
  editor: Editor | null;
  bodyTopics: SnapshotTag[];
  abstractTopics: SnapshotTag[];
  onDeleteAbstract: (id: string) => void;
}

export function TopicsSidebar({
  editor,
  bodyTopics,
  abstractTopics,
  onDeleteAbstract,
}: TopicsSidebarProps) {
  const allTopics = [
    ...bodyTopics.map((t) => ({ ...t, abstract: false })),
    ...abstractTopics
      .filter((t) => !bodyTopics.find((b) => b.id === t.id))
      .map((t) => ({ ...t, abstract: true })),
  ];

  if (allTopics.length === 0) return null;

  function handleDelete(topicId: string, isAbstract: boolean) {
    if (!isAbstract && editor) {
      removeTopicMark(editor, topicId);
    }
    if (isAbstract) {
      onDeleteAbstract(topicId);
    } else {
      // Also remove from abstract if it happens to be there
      onDeleteAbstract(topicId);
    }
  }

  return (
    <div dir="rtl">
      <p className="mb-1 text-xs font-medium text-gray-500">נושאים</p>
      <div className="space-y-1">
        {allTopics.map((topic) => (
          <div
            key={topic.id}
            className="flex items-center justify-between gap-1 rounded bg-blue-50 px-2 py-0.5"
          >
            <span className="text-xs text-blue-800">{topic.text}</span>
            <div className="flex items-center gap-1">
              {topic.abstract && (
                <span className="text-xs text-gray-400">[רקע]</span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(topic.id, topic.abstract)}
                className="text-blue-400 hover:text-red-500 text-xs"
                title="הסר נושא"
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
