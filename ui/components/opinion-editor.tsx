'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { SourceCitationExtension } from '@/ui/extensions/source-citation';
import { TopicMarkExtension } from '@/ui/extensions/topic-mark';
import { SageMarkExtension } from '@/ui/extensions/sage-mark';
import { ReferenceMarkExtension } from '@/ui/extensions/reference-mark';
import { KeyboardTriggersExtension } from '@/ui/extensions/keyboard-triggers';
import { useEditorPanels } from '@/ui/hooks/use-editor-panels';
import { useSources } from '@/ui/hooks/use-sources';
import { EditorToolbar } from './tiptap-editor/editor-toolbar';
import { SourceFooter } from './tiptap-editor/source-footer';
import { SourcesPanel } from './tiptap-editor/sources-panel';
import { TopicsPanel } from './tiptap-editor/topics-panel';
import { SagesPanel } from './tiptap-editor/sages-panel';
import { ReferencesPanel } from './tiptap-editor/references-panel';

interface OpinionEditorProps {
  responseId: string;
  initialContent: unknown;
  deleteRedirectUrl: string;
}

export function OpinionEditor({
  responseId,
  initialContent,
  deleteRedirectUrl,
}: OpinionEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      SourceCitationExtension,
      TopicMarkExtension,
      SageMarkExtension,
      ReferenceMarkExtension,
      KeyboardTriggersExtension,
    ],
    content: (initialContent as object) ?? {},
    immediatelyRender: false,
  });

  const sources = useSources();
  const { activePanel, closePanel } = useEditorPanels(editor);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/opinions/${responseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editor?.getJSON() ?? {} }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה בשמירה');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('למחוק את חוות הדעת?')) return;
    setError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/opinions/${responseId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה במחיקה');
        return;
      }
      router.push(deleteRedirectUrl);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Editor */}
      <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
        <EditorToolbar editor={editor} />

        {editor && (
          <div className="relative px-2 py-1 border-b border-gray-100 bg-gray-50 flex gap-1 flex-wrap" dir="rtl">
            {activePanel === 'sources' && (
              <SourcesPanel
                editor={editor}
                sources={sources}
                revisionId={responseId}
                onClose={closePanel}
              />
            )}
            {activePanel === 'topics' && (
              <TopicsPanel editor={editor} onClose={closePanel} />
            )}
            {activePanel === 'sages' && (
              <SagesPanel editor={editor} onClose={closePanel} />
            )}
            {activePanel === 'references' && (
              <ReferencesPanel editor={editor} onClose={closePanel} />
            )}
          </div>
        )}

        <div
          className="prose prose-sm max-w-none p-4 focus:outline-none min-h-[200px]"
          dir="rtl"
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <SourceFooter editor={editor} sources={sources} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'שומר...' : saved ? '✓ נשמר' : 'שמור'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
        >
          {deleting ? 'מוחק...' : 'מחק'}
        </button>
      </div>
    </div>
  );
}
