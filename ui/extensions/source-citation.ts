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

/**
 * Returns the citations together with the display number for each one.
 * Numbering rule: same sourceId reuses the number of its first occurrence;
 * a new number is allocated only for a sourceId that hasn't appeared yet.
 * Missing sources are not deduplicated — each instance gets its own number.
 */
export function getCitationNumbers(doc: ProseMirrorNode): {
  citations: CitationEntry[];
  numbers: number[];
} {
  const citations = getCitationList(doc);
  const numbers: number[] = [];
  const keyToNumber = new Map<string, number>();
  let next = 1;
  for (let i = 0; i < citations.length; i++) {
    const c = citations[i];
    const key = c.sourceId === 'missing' ? `__missing_${i}` : c.sourceId;
    let n = keyToNumber.get(key);
    if (n === undefined) {
      n = next++;
      keyToNumber.set(key, n);
    }
    numbers.push(n);
  }
  return { citations, numbers };
}

/** NodeView component for rendering [n] badges */
function SourceCitationView({ node, editor }: ReactNodeViewProps) {
  const sourceId = node.attrs.sourceId as string;
  const missingText = node.attrs.missingText as string | undefined;

  // NodeViews don't re-render when sibling nodes change, so we subscribe to
  // doc-changing transactions and force a re-render. Without this, inserting a
  // citation before an existing one leaves the existing one's number stale
  // until a remount (e.g. page refresh).
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    if (!editor) return;
    const handler = ({ transaction }: { transaction: { docChanged: boolean } }) => {
      if (transaction.docChanged) forceRender();
    };
    editor.on('transaction', handler);
    return () => {
      editor.off('transaction', handler);
    };
  }, [editor]);

  const { citations, numbers } = getCitationNumbers(editor.state.doc);
  const idx = citations.findIndex(
    (c) => c.sourceId === sourceId && c.missingText === missingText,
  );
  const number = idx >= 0 ? numbers[idx] : '?';

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

/**
 * Removes all sourceCitation nodes with the given sourceId from the entire
 * document. Numbering of the remaining citations recomputes automatically via
 * the NodeView, which derives its number from document order each render.
 * Does not handle "missing" sources — those are removed by deleting the
 * citation node directly in the editor.
 */
export function removeSourceCitation(editor: Editor, sourceId: string) {
  const { doc, tr } = editor.state;
  const positions: { from: number; to: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'sourceCitation' && node.attrs.sourceId === sourceId) {
      positions.push({ from: pos, to: pos + node.nodeSize });
    }
  });
  for (let i = positions.length - 1; i >= 0; i--) {
    tr.delete(positions[i].from, positions[i].to);
  }
  if (tr.docChanged) {
    editor.view.dispatch(tr);
  }
}
