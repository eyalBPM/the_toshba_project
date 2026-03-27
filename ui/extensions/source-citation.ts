'use client';

import { Node } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import React from 'react';

export interface CitationEntry {
  pos: number;
  sourceId: string;
  missingText?: string;
}

/**
 * Returns all sourceCitation nodes in document order (top-to-bottom).
 * Used by NodeView (to compute [n]) and by SourceFooter.
 */
export function getCitationList(doc: ProseMirrorNode): CitationEntry[] {
  const entries: CitationEntry[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'sourceCitation') {
      entries.push({
        pos,
        sourceId: node.attrs.sourceId as string,
        missingText: node.attrs.missingText as string | undefined,
      });
    }
  });
  return entries;
}

/** NodeView component for rendering [n] badges */
function SourceCitationView({ node, editor }: ReactNodeViewProps) {
  const sourceId = node.attrs.sourceId as string;
  const missingText = node.attrs.missingText as string | undefined;
  const citations = getCitationList(editor.state.doc);
  const idx = citations.findIndex(
    (c) => c.sourceId === sourceId && c.missingText === missingText,
  );
  const number = idx >= 0 ? idx + 1 : '?';

  return React.createElement(
    NodeViewWrapper,
    { as: 'span' },
    React.createElement(
      'span',
      {
        className:
          'source-citation inline-block rounded bg-amber-100 px-1 text-xs font-medium text-amber-800 cursor-default select-none',
        'data-source-id': sourceId,
      },
      `[${number}]`,
    ),
  );
}

/**
 * Inline atom node representing a source citation [n].
 * - sourceId: the ID from the Sources table, or "missing" for MissingSource entries
 * - missingText: free-text description (only when sourceId === "missing")
 *
 * The displayed number [n] is computed dynamically from document order, never stored.
 */
export const SourceCitationExtension = Node.create({
  name: 'sourceCitation',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      sourceId: { default: null },
      missingText: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-source-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-source-id': HTMLAttributes.sourceId,
        class: 'source-citation',
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SourceCitationView);
  },
});

/** Inserts a sourceCitation node at the current cursor position. */
export function insertSourceCitation(
  editor: Editor,
  sourceId: string,
  missingText?: string,
) {
  editor
    .chain()
    .focus()
    .insertContent({
      type: 'sourceCitation',
      attrs: { sourceId, missingText: missingText ?? null },
    })
    .run();
}
