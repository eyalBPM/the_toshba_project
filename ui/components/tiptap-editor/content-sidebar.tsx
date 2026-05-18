'use client';

import type { Editor } from '@tiptap/core';
import { TopicsSidebar } from './topics-sidebar';
import { SagesSidebar } from './sages-sidebar';
import { SourcesSidebar, type SidebarBodySource } from './sources-sidebar';
import { ReferencesSidebar } from './references-sidebar';
import type { SnapshotTag, ReferenceTag } from '@/ui/hooks/use-editor-state';
import {
  deriveAbstractTopics,
  deriveAbstractSages,
  deriveAbstractSources,
  deriveAbstractReferences,
  deriveBodyTopics,
  deriveBodySages,
  deriveBodySources,
  deriveBodyReferences,
  deriveSourceNumbers,
} from '@/lib/derive-abstract-entries';

type EditableProps = {
  readOnly?: false;
  editor: Editor | null;
  bodyTopics: SnapshotTag[];
  bodySages: SnapshotTag[];
  bodySources: SidebarBodySource[];
  bodyReferences: ReferenceTag[];
  abstractTopics: SnapshotTag[];
  abstractSages: SnapshotTag[];
  abstractSources: SnapshotTag[];
  abstractReferences: ReferenceTag[];
  onRemoveAbstractTopic: (id: string) => void;
  onRemoveAbstractSage: (id: string) => void;
  onRemoveAbstractSource: (id: string) => void;
  onRemoveAbstractReference: (articleId: string) => void;
};

type ReadOnlyProps = {
  readOnly: true;
  snapshot: {
    topicsSnapshot: unknown;
    sagesSnapshot: unknown;
    sourcesSnapshot: unknown;
    referencesSnapshot: unknown;
  };
  content: unknown;
};

type ContentSidebarProps = EditableProps | ReadOnlyProps;

export function ContentSidebar(props: ContentSidebarProps) {
  const isReadOnly = props.readOnly === true;

  const derived = props.readOnly
    ? (() => {
        const numbers = deriveSourceNumbers(props.content);
        return {
          bodyTopics: deriveBodyTopics(props.snapshot.topicsSnapshot, props.content),
          abstractTopics: deriveAbstractTopics(
            props.snapshot.topicsSnapshot,
            props.content,
          ),
          bodySages: deriveBodySages(props.snapshot.sagesSnapshot, props.content),
          abstractSages: deriveAbstractSages(
            props.snapshot.sagesSnapshot,
            props.content,
          ),
          bodySources: deriveBodySources(props.snapshot.sourcesSnapshot, props.content).map(
            (s): SidebarBodySource => ({
              id: s.id,
              label: s.label,
              number: numbers.get(s.id),
            }),
          ),
          abstractSources: deriveAbstractSources(
            props.snapshot.sourcesSnapshot,
            props.content,
          ),
          bodyReferences: deriveBodyReferences(
            props.snapshot.referencesSnapshot,
            props.content,
          ),
          abstractReferences: deriveAbstractReferences(
            props.snapshot.referencesSnapshot,
            props.content,
          ),
        };
      })()
    : {
        bodyTopics: props.bodyTopics,
        abstractTopics: props.abstractTopics,
        bodySages: props.bodySages,
        abstractSages: props.abstractSages,
        bodySources: props.bodySources,
        abstractSources: props.abstractSources,
        bodyReferences: props.bodyReferences,
        abstractReferences: props.abstractReferences,
      };

  const hasAnyContent =
    derived.bodyTopics.length > 0 ||
    derived.abstractTopics.length > 0 ||
    derived.bodySages.length > 0 ||
    derived.abstractSages.length > 0 ||
    derived.bodySources.length > 0 ||
    derived.abstractSources.length > 0 ||
    derived.bodyReferences.length > 0 ||
    derived.abstractReferences.length > 0;

  if (!hasAnyContent) return null;

  const editor = isReadOnly ? null : props.editor;

  return (
    <div className="space-y-4">
      <SourcesSidebar
        editor={editor}
        bodySources={derived.bodySources}
        abstractSources={derived.abstractSources}
        onDeleteAbstract={isReadOnly ? undefined : props.onRemoveAbstractSource}
        readOnly={isReadOnly}
      />
      <TopicsSidebar
        editor={editor}
        bodyTopics={derived.bodyTopics}
        abstractTopics={derived.abstractTopics}
        onDeleteAbstract={isReadOnly ? undefined : props.onRemoveAbstractTopic}
        readOnly={isReadOnly}
      />
      <ReferencesSidebar
        editor={editor}
        bodyReferences={derived.bodyReferences}
        abstractReferences={derived.abstractReferences}
        onDeleteAbstract={isReadOnly ? undefined : props.onRemoveAbstractReference}
        readOnly={isReadOnly}
      />
      <SagesSidebar
        editor={editor}
        bodySages={derived.bodySages}
        abstractSages={derived.abstractSages}
        onDeleteAbstract={isReadOnly ? undefined : props.onRemoveAbstractSage}
        readOnly={isReadOnly}
      />
    </div>
  );
}
