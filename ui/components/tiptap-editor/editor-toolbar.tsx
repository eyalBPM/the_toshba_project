'use client';

import type { Editor } from '@tiptap/core';

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButton {
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  variant?: 'default' | 'active';
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const insertButtons: ToolbarButton[] = [
    {
      label: 'מקורות',
      title: 'הוסף מקור (Shift+2)',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick: () => (editor as any).emit('openSourcesPanel', {}),
    },
    {
      label: 'נושאים',
      title: 'הוסף נושא (Shift+3)',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick: () => (editor as any).emit('openTopicsPanel', {}),
    },
    {
      label: 'הפניות',
      title: 'הוסף הפניה לערך (Shift+4)',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick: () => (editor as any).emit('openReferencesPanel', {}),
    },
    {
      label: 'חכמים',
      title: 'הוסף חכם (Shift+5)',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick: () => (editor as any).emit('openSagesPanel', {}),
    },
  ];

  const formatButtons: ToolbarButton[] = [
    {
      label: 'ב',
      title: 'מודגש',
      onClick: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      label: 'נ',
      title: 'נטוי',
      onClick: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5" dir="rtl">
      {insertButtons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          title={btn.title}
          onClick={btn.onClick}
          className="rounded px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
        >
          {btn.label}
        </button>
      ))}
      <span className="mx-1 h-4 w-px bg-gray-300" />
      {formatButtons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          title={btn.title}
          onClick={btn.onClick}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            btn.active
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
