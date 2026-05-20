'use client';

import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/core';
import { insertTable } from '@/ui/extensions/table';

interface EditorToolbarProps {
  editor: Editor | null;
  children?: ReactNode;
}

interface ToolbarButton {
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  variant?: 'default' | 'active';
}

export function EditorToolbar({ editor, children }: EditorToolbarProps) {
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
      title: 'הוסף הפניה למאמר (Shift+4)',
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

  const inTable = editor.isActive('table');
  const tableButtons: ToolbarButton[] = [
    {
      label: '+ שורה',
      title: 'הוסף שורה מתחת',
      onClick: () => editor.chain().focus().addRowAfter().run(),
    },
    {
      label: '+ עמודה',
      title: 'הוסף עמודה משמאל',
      onClick: () => editor.chain().focus().addColumnAfter().run(),
    },
    {
      label: '− שורה',
      title: 'מחק שורה',
      onClick: () => editor.chain().focus().deleteRow().run(),
    },
    {
      label: '− עמודה',
      title: 'מחק עמודה',
      onClick: () => editor.chain().focus().deleteColumn().run(),
    },
    {
      label: 'מזג',
      title: 'מזג / פצל תאים',
      onClick: () => editor.chain().focus().mergeOrSplit().run(),
    },
    {
      label: 'מחק טבלה',
      title: 'מחק את הטבלה',
      onClick: () => editor.chain().focus().deleteTable().run(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-1 rounded-t-lg border-b border-gray-200 bg-gray-50 px-2 py-1.5" dir="rtl">
      <div className="flex flex-wrap items-center gap-1">
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
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {children}
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
        <button
          type="button"
          title="הוסף טבלה (Shift+6)"
          onClick={() => insertTable(editor)}
          className="rounded px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
        >
          טבלה
        </button>
        {inTable && (
          <>
            <span className="mx-1 h-4 w-px bg-gray-300" />
            {tableButtons.map((btn) => (
              <button
                key={btn.label}
                type="button"
                title={btn.title}
                onClick={btn.onClick}
                className="rounded px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-amber-100 hover:text-amber-800 transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
