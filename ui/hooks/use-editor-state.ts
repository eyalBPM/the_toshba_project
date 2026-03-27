'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/core';
import { getCitationList } from '@/ui/extensions/source-citation';
import type { DbSourceItem } from './use-sources';

export interface SnapshotTag {
  id: string;
  text: string;
}

export interface EditorSnapshot {
  topicsSnapshot: SnapshotTag[];
  sagesSnapshot: SnapshotTag[];
  sourcesSnapshot: { id: string; label: string }[];
  referencesSnapshot: { articleId: string; slug: string; title: string }[];
  contentLength: number;
}

function deriveSnapshotFromDoc(
  editor: Editor,
  sources: DbSourceItem[],
  abstractTopics: SnapshotTag[],
  abstractSources: SnapshotTag[],
): EditorSnapshot {
  const { doc } = editor.state;
  const topicsMap = new Map<string, SnapshotTag>();
  const sagesMap = new Map<string, SnapshotTag>();
  const refsMap = new Map<string, { articleId: string; slug: string; title: string }>();

  doc.descendants((node) => {
    if (!node.isText) return;
    for (const mark of node.marks) {
      if (mark.type.name === 'topicMark') {
        topicsMap.set(mark.attrs.topicId as string, {
          id: mark.attrs.topicId as string,
          text: mark.attrs.topicText as string,
        });
      } else if (mark.type.name === 'sageMark') {
        sagesMap.set(mark.attrs.sageId as string, {
          id: mark.attrs.sageId as string,
          text: mark.attrs.sageText as string,
        });
      } else if (mark.type.name === 'referenceMark') {
        refsMap.set(mark.attrs.articleId as string, {
          articleId: mark.attrs.articleId as string,
          slug: mark.attrs.articleSlug as string,
          title: mark.attrs.articleTitle as string,
        });
      }
    }
  });

  // Merge abstract topics into body topics
  for (const t of abstractTopics) {
    if (!topicsMap.has(t.id)) topicsMap.set(t.id, t);
  }

  // Build sourcesSnapshot from citations in document order (real sources only)
  const citations = getCitationList(doc);
  const sourcesMap = new Map<string, { id: string; label: string }>();
  for (const c of citations) {
    if (c.sourceId === 'missing') continue;
    if (sourcesMap.has(c.sourceId)) continue;
    const src = sources.find((s) => s.id === c.sourceId);
    if (src) sourcesMap.set(c.sourceId, { id: src.id, label: src.label });
  }
  // Merge abstract sources
  for (const s of abstractSources) {
    if (!sourcesMap.has(s.id)) sourcesMap.set(s.id, { id: s.id, label: s.text });
  }

  const contentLength = editor.getText().length;

  return {
    topicsSnapshot: Array.from(topicsMap.values()),
    sagesSnapshot: Array.from(sagesMap.values()),
    sourcesSnapshot: Array.from(sourcesMap.values()),
    referencesSnapshot: Array.from(refsMap.values()),
    contentLength,
  };
}

export function useEditorState(
  editor: Editor | null,
  sources: DbSourceItem[],
  initialAbstractTopics: SnapshotTag[] = [],
  initialAbstractSources: SnapshotTag[] = [],
) {
  const [abstractTopics, setAbstractTopics] = useState<SnapshotTag[]>(initialAbstractTopics);
  const [abstractSources, setAbstractSources] = useState<SnapshotTag[]>(initialAbstractSources);
  const [snapshot, setSnapshot] = useState<EditorSnapshot>({
    topicsSnapshot: [],
    sagesSnapshot: [],
    sourcesSnapshot: [],
    referencesSnapshot: [],
    contentLength: 0,
  });

  const recompute = useCallback(() => {
    if (!editor) return;
    setSnapshot(deriveSnapshotFromDoc(editor, sources, abstractTopics, abstractSources));
  }, [editor, sources, abstractTopics, abstractSources]);

  // Recompute on every transaction that changes the document
  useEffect(() => {
    if (!editor) return;
    const handler = () => recompute();
    editor.on('transaction', handler);
    recompute(); // initial computation
    return () => {
      editor.off('transaction', handler);
    };
  }, [editor, recompute]);

  // Also recompute when abstract lists change
  useEffect(() => {
    recompute();
  }, [recompute]);

  const addAbstractTopic = useCallback((tag: SnapshotTag) => {
    setAbstractTopics((prev) => (prev.find((t) => t.id === tag.id) ? prev : [...prev, tag]));
  }, []);

  const addAbstractSource = useCallback((tag: SnapshotTag) => {
    setAbstractSources((prev) => (prev.find((s) => s.id === tag.id) ? prev : [...prev, tag]));
  }, []);

  const removeAbstractTopic = useCallback((id: string) => {
    setAbstractTopics((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const removeAbstractSource = useCallback((id: string) => {
    setAbstractSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    snapshot,
    abstractTopics,
    abstractSources,
    addAbstractTopic,
    addAbstractSource,
    removeAbstractTopic,
    removeAbstractSource,
  };
}
