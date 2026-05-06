import { Node } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export interface SageAttrs {
  sageId: string;
  sageText: string;
}

/**
 * Atomic inline node for a sage mention. Cursor cannot be placed inside;
 * deleting one character removes the whole entity.
 */
export const SageMarkExtension = Node.create({
  name: 'sageMark',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      sageId: { default: null },
      sageText: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-sage-id]',
        getAttrs: (el) => {
          if (typeof el === 'string') return false;
          return {
            sageId: el.getAttribute('data-sage-id'),
            sageText: el.textContent ?? '',
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-sage-id': node.attrs.sageId,
        class: 'sage-mark inline-block rounded bg-green-100 px-1 text-green-800',
      },
      node.attrs.sageText,
    ];
  },

  renderText({ node }) {
    return (node.attrs.sageText as string) ?? '';
  },
});

/** Inserts a sage atom node, replacing any selected text with it. */
export function insertSage(
  editor: Editor,
  sageId: string,
  sageText: string,
  selectedText?: string,
) {
  const { from, to, empty } = editor.state.selection;
  const display = !empty && selectedText !== undefined ? selectedText : sageText;
  const chain = editor.chain().focus();
  if (!empty) {
    chain.deleteRange({ from, to });
  }
  chain
    .insertContent({
      type: 'sageMark',
      attrs: { sageId, sageText: display },
    })
    .run();
}

/** Removes all sage atom nodes with the given sageId from the entire document. */
export function removeSageMark(editor: Editor, sageId: string) {
  const { doc, tr } = editor.state;
  const positions: { from: number; to: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'sageMark' && node.attrs.sageId === sageId) {
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
