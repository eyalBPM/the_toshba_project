'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useEditorState } from '@/ui/hooks/use-editor-state';
import { EditorToolbar } from './tiptap-editor/editor-toolbar';
import { SourcesPanel } from './tiptap-editor/sources-panel';
import { TopicsPanel } from './tiptap-editor/topics-panel';
import { SagesPanel } from './tiptap-editor/sages-panel';
import { ReferencesPanel } from './tiptap-editor/references-panel';
import { ContentSidebar } from './tiptap-editor/content-sidebar';
import { OpinionClusterControls } from './opinion-cluster-controls';

interface OpinionEditorProps {
  responseId: string;
  initialContent: unknown;
  initialClusterId: string;
  initialPublished: boolean;
  deleteRedirectUrl: string;
}

export function OpinionEditor({
  responseId,
  initialContent,
  initialClusterId,
  initialPublished,
  deleteRedirectUrl,
}: OpinionEditorProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Edit-mode invariant: a response in the editor must be unpublished.
  // If the user landed here while published was still true (e.g. direct URL
  // navigation that skipped the view-page Edit button), unpublish defensively
  // on mount. Guarded by a ref so React strict-mode double-invocation doesn't
  // double-fire the PATCH.
  const unpublishedOnMount = useRef(false);
  useEffect(() => {
    if (initialPublished && !unpublishedOnMount.current) {
      unpublishedOnMount.current = true;
      fetch(`/api/opinions/${responseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: false }),
      }).catch(() => { /* best effort */ });
    }
  }, [initialPublished, responseId]);

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
    editorProps: {
      attributes: {
        class: 'min-h-184 focus:outline-none',
      },
    },
  });

  const sources = useSources();
  const { activePanel, closePanel } = useEditorPanels(editor);

  // Opinions don't persist abstract entries — the sidebar reflects body only.
  const {
    snapshot,
    bodySources,
  } = useEditorState(editor, sources);
  const noopRemove = useCallback(() => {}, []);

  // ── Auto-save ───────────────────────────────────────────
  // Debounce content changes and PATCH after 1.5s of inactivity. Compare JSON
  // strings to skip no-op saves. On unmount, flush any pending save (best-effort
  // fire-and-forget) so navigating away mid-typing does not lose the last edit.
  const lastSavedJsonRef = useRef<string>(JSON.stringify(initialContent ?? {}));
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSave = useCallback(
    async (contentJson: unknown) => {
      const jsonText = JSON.stringify(contentJson);
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/opinions/${responseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          // Edit-mode invariant: every save in the editor keeps the response
          // unpublished. The user explicitly publishes from the view page.
          body: JSON.stringify({ content: contentJson, published: false }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        lastSavedJsonRef.current = jsonText;
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    [responseId],
  );

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      const currentJson = JSON.stringify(editor.getJSON());
      if (currentJson === lastSavedJsonRef.current) return;
      // Reset to pending feedback; status flips to 'saving' when the PATCH fires.
      setSaveStatus('idle');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        performSave(editor.getJSON());
      }, 1500);
    };
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, performSave]);

  // Flush pending save on unmount so a quick "back to view" click after typing
  // does not lose the last edit.
  useEffect(() => {
    return () => {
      if (!saveTimerRef.current) return;
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      if (!editor) return;
      const currentJson = JSON.stringify(editor.getJSON());
      if (currentJson === lastSavedJsonRef.current) return;
      // Fire-and-forget — component is unmounting, no UI to update.
      fetch(`/api/opinions/${responseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editor.getJSON(), published: false }),
      }).catch(() => { /* best effort */ });
    };
  }, [editor, responseId]);

  const retrySave = useCallback(() => {
    if (!editor) return;
    performSave(editor.getJSON());
  }, [editor, performSave]);

  async function handleDelete() {
    if (!confirm('למחוק את תגובת הדעה?')) return;
    setDeleteError('');
    setDeleting(true);
    try {
      // Cancel any pending auto-save — the response is about to be deleted.
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const res = await fetch(`/api/opinions/${responseId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        setDeleteError(json.error?.message ?? 'שגיאה במחיקה');
        return;
      }
      router.push(deleteRedirectUrl);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <OpinionClusterControls
        responseId={responseId}
        initialClusterId={initialClusterId}
      />

      {/* Editor + Sidebar layout */}
      <div className="flex gap-4" dir="rtl">
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-gray-300 bg-white">
            <div className="sticky top-0 z-20">
              <EditorToolbar editor={editor} />

              {editor && (
                <div className="relative" dir="rtl">
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
            </div>

            <div className="bg-gray-100 px-4 py-6 rounded-b-lg">
              <div className="mx-auto max-w-360 rounded-sm bg-white shadow-md">
                <div
                  className="prose prose-sm max-w-none px-10 py-8"
                  dir="rtl"
                >
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-44 shrink-0">
          <ContentSidebar
            editor={editor}
            bodySources={bodySources}
            abstractSources={[]}
            bodyTopics={snapshot.topicsSnapshot}
            abstractTopics={[]}
            bodyReferences={snapshot.referencesSnapshot}
            abstractReferences={[]}
            bodySages={snapshot.sagesSnapshot}
            abstractSages={[]}
            onRemoveAbstractSource={noopRemove}
            onRemoveAbstractTopic={noopRemove}
            onRemoveAbstractReference={noopRemove}
            onRemoveAbstractSage={noopRemove}
          />
        </div>
      </div>

      {/* Auto-save status + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
        <div className="text-xs text-gray-500" aria-live="polite">
          {saveStatus === 'saving' && 'שומר...'}
          {saveStatus === 'saved' && '✓ נשמר אוטומטית'}
          {saveStatus === 'error' && (
            <span className="text-red-600">
              שמירה נכשלה.{' '}
              <button
                type="button"
                onClick={retrySave}
                className="underline hover:text-red-700"
              >
                נסה שוב
              </button>
            </span>
          )}
          {saveStatus === 'idle' && ' '}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
        >
          {deleting ? 'מוחק...' : 'מחק'}
        </button>
      </div>
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
    </div>
  );
}
