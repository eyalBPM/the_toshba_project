'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { SourceCitationExtension } from '@/ui/extensions/source-citation';
import { TopicMarkExtension } from '@/ui/extensions/topic-mark';
import { SageMarkExtension } from '@/ui/extensions/sage-mark';
import { ReferenceMarkExtension } from '@/ui/extensions/reference-mark';
import { KeyboardTriggersExtension } from '@/ui/extensions/keyboard-triggers';
import { ImageNodeExtension } from '@/ui/extensions/image-node';
import { ImageUploadButton } from './tiptap-editor/image-upload-button';
import { useEditorState } from '@/ui/hooks/use-editor-state';
import type { SnapshotTag } from '@/ui/hooks/use-editor-state';
import { useEditorPanels } from '@/ui/hooks/use-editor-panels';
import { useSources } from '@/ui/hooks/use-sources';
import { EditorToolbar } from './tiptap-editor/editor-toolbar';
import { SourceFooter } from './tiptap-editor/source-footer';
import { SourcesPanel } from './tiptap-editor/sources-panel';
import { TopicsPanel } from './tiptap-editor/topics-panel';
import { SagesPanel } from './tiptap-editor/sages-panel';
import { ReferencesPanel } from './tiptap-editor/references-panel';
import { TopicsSidebar } from './tiptap-editor/topics-sidebar';
import { SagesSidebar } from './tiptap-editor/sages-sidebar';
import { useState } from 'react';

interface RevisionEditorProps {
  revisionId: string;
  initialTitle: string;
  initialContent: unknown;
  initialTopics: SnapshotTag[];
  initialSages: SnapshotTag[];
  initialAbstractTopics?: SnapshotTag[];
  initialAbstractSources?: SnapshotTag[];
  status: string;
  agreementCount?: number;
  hasApprovedMinorChange?: boolean;
  /** Where to navigate after delete */
  deleteRedirectUrl: string;
}

export function RevisionEditor({
  revisionId,
  initialTitle,
  initialContent,
  initialTopics,
  initialSages,
  initialAbstractTopics = [],
  initialAbstractSources = [],
  status,
  agreementCount = 0,
  hasApprovedMinorChange = false,
  deleteRedirectUrl,
}: RevisionEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retracting, setRetracting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const editable = status === 'Draft' || status === 'Pending';

  const editor = useEditor({
    extensions: [
      StarterKit,
      SourceCitationExtension,
      TopicMarkExtension,
      SageMarkExtension,
      ReferenceMarkExtension,
      KeyboardTriggersExtension,
      ImageNodeExtension,
    ],
    content: (initialContent as object) ?? {},
    editable,
    immediatelyRender: false,
  });

  const sources = useSources();

  const {
    snapshot,
    abstractTopics,
    abstractSources,
    addAbstractTopic,
    addAbstractSource,
    removeAbstractTopic,
  } = useEditorState(editor, sources, initialAbstractTopics, initialAbstractSources);

  const { activePanel, closePanel } = useEditorPanels(editor);

  const buildPayload = useCallback(() => {
    return {
      title,
      content: editor?.getJSON() ?? {},
      snapshot,
    };
  }, [title, editor, snapshot]);

  async function handleSave() {
    if (agreementCount > 0 && !hasApprovedMinorChange) {
      if (!confirm(`לגרסה זו יש ${agreementCount} הסכמות. עריכה תאפס את כולן. להמשיך?`)) return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
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

  async function handleSubmit() {
    if (!confirm('להגיש את הגרסה לבדיקה קהילתית?')) return;
    setError('');
    setSubmitting(true);
    try {
      const saveRes = await fetch(`/api/revisions/${revisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!saveRes.ok) {
        const json = await saveRes.json();
        setError(json.error?.message ?? 'שגיאה בשמירה');
        return;
      }
      const submitRes = await fetch(`/api/revisions/${revisionId}/submit`, {
        method: 'POST',
      });
      if (!submitRes.ok) {
        const json = await submitRes.json();
        setError(json.error?.message ?? 'שגיאה בהגשה');
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetract() {
    if (!confirm('לשנות חזרה לטיוטה?')) return;
    setError('');
    setRetracting(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}/retract`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message ?? 'שגיאה');
        return;
      }
      router.refresh();
    } finally {
      setRetracting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('למחוק את הטיוטה?')) return;
    setError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/revisions/${revisionId}`, { method: 'DELETE' });
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
      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">כותרת</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="כותרת הערך..."
          disabled={!editable}
        />
      </div>

      {/* Editor + Sidebar layout */}
      <div className="flex gap-4" dir="rtl">
        {/* Main editor area */}
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
            {editable && (
              <div className="flex items-center border-b border-gray-100">
                <EditorToolbar editor={editor} />
                {editor && (
                  <ImageUploadButton editor={editor} revisionId={revisionId} />
                )}
              </div>
            )}

            {/* Toolbar panel anchors (relative positioning for floating panels) */}
            {editable && editor && (
              <div className="relative px-2 py-1 border-b border-gray-100 bg-gray-50 flex gap-1 flex-wrap" dir="rtl">
                {activePanel === 'sources' && (
                  <SourcesPanel
                    editor={editor}
                    sources={sources}
                    revisionId={revisionId}
                    onAbstractAdd={addAbstractSource}
                    onClose={closePanel}
                  />
                )}
                {activePanel === 'topics' && (
                  <TopicsPanel
                    editor={editor}
                    onAbstractAdd={addAbstractTopic}
                    onClose={closePanel}
                  />
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
        </div>

        {/* Sidebar: topics + sages */}
        {(snapshot.topicsSnapshot.length > 0 ||
          abstractTopics.length > 0 ||
          snapshot.sagesSnapshot.length > 0) && (
          <div className="w-44 shrink-0 space-y-4">
            <TopicsSidebar
              editor={editor}
              bodyTopics={snapshot.topicsSnapshot}
              abstractTopics={abstractTopics}
              onDeleteAbstract={removeAbstractTopic}
            />
            <SagesSidebar editor={editor} bodySages={snapshot.sagesSnapshot} />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
        {editable && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'שומר...' : saved ? '✓ נשמר' : 'שמור'}
          </button>
        )}

        {status === 'Draft' && (
          <>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'מגיש...' : 'הגש לבדיקה'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              {deleting ? 'מוחק...' : 'מחק טיוטה'}
            </button>
          </>
        )}

        {status === 'Pending' && (
          <button
            onClick={handleRetract}
            disabled={retracting}
            className="rounded-md bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
          >
            {retracting ? 'מחזיר...' : 'החזר לטיוטה'}
          </button>
        )}
      </div>
    </div>
  );
}
