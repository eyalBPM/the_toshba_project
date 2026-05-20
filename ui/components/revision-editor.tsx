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
import { ImageNodeExtension } from '@/ui/extensions/image-node';
import { TableExtensions } from '@/ui/extensions/table';
import { ImageUploadButton } from './tiptap-editor/image-upload-button';
import { useEditorState } from '@/ui/hooks/use-editor-state';
import type { SnapshotTag, ReferenceTag } from '@/ui/hooks/use-editor-state';
import { useEditorPanels } from '@/ui/hooks/use-editor-panels';
import { useSources } from '@/ui/hooks/use-sources';
import { useAutoSave } from '@/ui/hooks/use-auto-save';
import { useBeforeUnload } from '@/ui/hooks/use-before-unload';
import { EditorToolbar } from './tiptap-editor/editor-toolbar';
import { SourcesPanel } from './tiptap-editor/sources-panel';
import { TopicsPanel } from './tiptap-editor/topics-panel';
import { SagesPanel } from './tiptap-editor/sages-panel';
import { ReferencesPanel } from './tiptap-editor/references-panel';
import { ContentSidebar } from './tiptap-editor/content-sidebar';
import { RevisionEditorActions } from './revision-editor-actions';
import { McrEditorActions } from './mcr-editor-actions';
import { ConfirmDialog } from './confirm-dialog';
import { ImageVisibilityProvider } from './image-visibility-context';

export type EditorMode = 'normal' | 'mcr';

interface RevisionEditorProps {
  revisionId: string;
  initialTitle: string;
  initialContent: unknown;
  initialAbstractTopics?: SnapshotTag[];
  initialAbstractSources?: SnapshotTag[];
  initialAbstractSages?: SnapshotTag[];
  initialAbstractReferences?: ReferenceTag[];
  status: string;
  agreementCount?: number;
  deleteRedirectUrl: string;
  viewUrl: string;
  editorMode?: EditorMode;
  mcrId?: string;
  mcrTitle?: string;
  mcrContent?: unknown;
  mcrSnapshotData?: unknown;
  mcrMessage?: string;
}

export function RevisionEditor({
  revisionId,
  initialTitle,
  initialContent,
  initialAbstractTopics = [],
  initialAbstractSources = [],
  initialAbstractSages = [],
  initialAbstractReferences = [],
  status,
  agreementCount = 0,
  deleteRedirectUrl,
  viewUrl,
  editorMode = 'normal',
  mcrId,
  mcrTitle,
  mcrContent,
  mcrSnapshotData,
  mcrMessage,
}: RevisionEditorProps) {
  const router = useRouter();
  const isMcrMode = editorMode === 'mcr';

  // In MCR mode, use MCR content if editing existing MCR; otherwise use revision content
  const effectiveTitle = isMcrMode && mcrTitle ? mcrTitle : initialTitle;
  const effectiveContent = isMcrMode && mcrContent ? mcrContent : initialContent;

  const [title, setTitle] = useState(effectiveTitle);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [autoSaveError, setAutoSaveError] = useState('');

  const editable = (status === 'Draft' || status === 'Pending') && viewMode === 'edit';

  const editor = useEditor({
    extensions: [
      StarterKit,
      SourceCitationExtension,
      TopicMarkExtension,
      SageMarkExtension,
      ReferenceMarkExtension,
      KeyboardTriggersExtension,
      ImageNodeExtension,
      ...TableExtensions,
    ],
    content: (effectiveContent as object) ?? {},
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-184 focus:outline-none',
      },
    },
  });

  // Toggle editor editable state when viewMode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(viewMode === 'edit');
    }
  }, [editor, viewMode]);

  const sources = useSources();

  const {
    snapshot,
    bodySources,
    abstractTopics,
    abstractSources,
    abstractSages,
    abstractReferences,
    addAbstractTopic,
    addAbstractSource,
    addAbstractSage,
    addAbstractReference,
    removeAbstractTopic,
    removeAbstractSource,
    removeAbstractSage,
    removeAbstractReference,
  } = useEditorState(
    editor,
    sources,
    initialAbstractTopics,
    initialAbstractSources,
    initialAbstractSages,
    initialAbstractReferences,
  );

  const { activePanel, closePanel } = useEditorPanels(editor);

  const buildPayload = useCallback(() => {
    return {
      title,
      content: editor?.getJSON() ?? {},
      snapshot,
    };
  }, [title, editor, snapshot]);

  // Auto-save (disabled in MCR mode and preview mode)
  const autoSaveEnabled = !isMcrMode && editable;
  const { saving, lastSaved, error: saveError, triggerSave } = useAutoSave({
    enabled: autoSaveEnabled,
    delay: 1500,
    onSave: async () => {
      const res = await fetch(`/api/revisions/${revisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? 'שגיאה בשמירה');
      }
    },
  });

  // Track content changes to trigger auto-save
  const prevTitleRef = useRef(title);
  useEffect(() => {
    if (prevTitleRef.current !== title) {
      prevTitleRef.current = title;
      triggerSave();
    }
  }, [title, triggerSave]);

  // Listen to editor transactions for content changes
  useEffect(() => {
    if (!editor || !autoSaveEnabled) return;
    const handler = () => triggerSave();
    editor.on('update', handler);
    return () => { editor.off('update', handler); };
  }, [editor, autoSaveEnabled, triggerSave]);

  // Trigger auto-save when abstract entries change (body stays the same,
  // so the editor 'update' event does not fire). Skip the initial mount.
  const abstractsInitializedRef = useRef(false);
  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (!abstractsInitializedRef.current) {
      abstractsInitializedRef.current = true;
      return;
    }
    triggerSave();
  }, [
    abstractTopics,
    abstractSources,
    abstractSages,
    abstractReferences,
    autoSaveEnabled,
    triggerSave,
  ]);

  // Browser warning in MCR mode
  useBeforeUnload(isMcrMode);

  // Propagate save error
  useEffect(() => {
    if (saveError) setAutoSaveError(saveError);
    else setAutoSaveError('');
  }, [saveError]);

  return (
    <div className="space-y-4">
      {/* Header: title + view mode toggle + auto-save status */}
      <div className="flex items-start gap-4" dir="rtl">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">כותרת</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="כותרת המאמר..."
            disabled={viewMode === 'preview'}
          />
        </div>
        <div className="flex items-center gap-2 pt-7">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            {viewMode === 'edit' ? 'תצוגה מקדימה' : 'חזרה לעריכה'}
          </button>

          {/* Auto-save status indicator */}
          {autoSaveEnabled && (
            <span className="text-xs text-gray-400">
              {saving
                ? 'שומר...'
                : lastSaved
                  ? `נשמר ${lastSaved.toLocaleTimeString('he-IL')}`
                  : ''}
            </span>
          )}
          {isMcrMode && (
            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
              מצב שינוי מינורי
            </span>
          )}
        </div>
      </div>

      {/* Editor + Sidebar layout */}
      <div className="flex gap-4" dir="rtl">
        {/* Main editor area */}
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-gray-300 bg-white">
            {editable && (
              <div className="sticky top-0 z-20">
                <EditorToolbar editor={editor}>
                  {editor && (
                    <ImageUploadButton editor={editor} revisionId={revisionId} />
                  )}
                </EditorToolbar>

                {/* Toolbar panel anchors (zero-height when no panel is open) */}
                {editor && (
                  <div className="relative" dir="rtl">
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
                      <SagesPanel
                        editor={editor}
                        onAbstractAdd={addAbstractSage}
                        onClose={closePanel}
                      />
                    )}
                    {activePanel === 'references' && (
                      <ReferencesPanel
                        editor={editor}
                        onAbstractAdd={addAbstractReference}
                        onClose={closePanel}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-100 px-4 py-6 rounded-b-lg">
              <div className="mx-auto max-w-360 rounded-sm bg-white shadow-md">
                <div
                  className="prose prose-sm max-w-none px-10 py-8"
                  dir="rtl"
                >
                  <ImageVisibilityProvider value={{ isOwner: true, imageStatuses: {} }}>
                    <EditorContent editor={editor} />
                  </ImageVisibilityProvider>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar: sources + topics + references + sages */}
        <div className="w-44 shrink-0">
          <ContentSidebar
            editor={editor}
            bodySources={bodySources}
            abstractSources={abstractSources}
            bodyTopics={snapshot.topicsSnapshot}
            abstractTopics={abstractTopics}
            bodyReferences={snapshot.referencesSnapshot}
            abstractReferences={abstractReferences}
            bodySages={snapshot.sagesSnapshot}
            abstractSages={abstractSages}
            onRemoveAbstractSource={removeAbstractSource}
            onRemoveAbstractTopic={removeAbstractTopic}
            onRemoveAbstractReference={removeAbstractReference}
            onRemoveAbstractSage={removeAbstractSage}
          />
        </div>
      </div>

      {autoSaveError && <p className="text-sm text-red-600">{autoSaveError}</p>}

      {/* Action buttons */}
      {isMcrMode ? (
        <McrEditorActions
          revisionId={revisionId}
          mcrId={mcrId}
          initialMessage={mcrMessage}
          buildPayload={buildPayload}
          viewUrl={viewUrl}
        />
      ) : (
        <RevisionEditorActions
          revisionId={revisionId}
          status={status}
          deleteRedirectUrl={deleteRedirectUrl}
          viewUrl={viewUrl}
          buildPayload={buildPayload}
        />
      )}
    </div>
  );
}
