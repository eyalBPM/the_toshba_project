'use client';

import { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/core';

export type PanelType = 'sources' | 'topics' | 'sages' | 'references' | null;

export function useEditorPanels(editor: Editor | null): {
  activePanel: PanelType;
  closePanel: () => void;
} {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  useEffect(() => {
    if (!editor) return;

    const openSources = () => setActivePanel('sources');
    const openTopics = () => setActivePanel('topics');
    const openSages = () => setActivePanel('sages');
    const openReferences = () => setActivePanel('references');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = editor as any;
    e.on('openSourcesPanel', openSources);
    e.on('openTopicsPanel', openTopics);
    e.on('openSagesPanel', openSages);
    e.on('openReferencesPanel', openReferences);

    return () => {
      e.off('openSourcesPanel', openSources);
      e.off('openTopicsPanel', openTopics);
      e.off('openSagesPanel', openSages);
      e.off('openReferencesPanel', openReferences);
    };
  }, [editor]);

  return {
    activePanel,
    closePanel: () => setActivePanel(null),
  };
}
