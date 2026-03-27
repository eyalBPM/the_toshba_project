import { Mark } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export interface SageAttrs {
  sageId: string;
  sageText: string;
}

/**
 * Inline mark for sage mentions. Styled in green.
 * inclusive: false — typing immediately after a sage mark does not extend it.
 */
export const SageMarkExtension = Mark.create({
  name: 'sageMark',

  addAttributes() {
    return {
      sageId: { default: null },
      sageText: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-sage-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-sage-id': HTMLAttributes.sageId,
        class: 'sage-mark inline-block rounded bg-green-100 px-1 text-green-800',
      },
      0,
    ];
  },

  inclusive: false,
});

/** Inserts a sage mark at the current cursor position, or wraps selected text. */
export function insertSage(
  editor: Editor,
  sageId: string,
  sageText: string,
  selectedText?: string,
) {
  const { empty } = editor.state.selection;
  if (!empty && selectedText !== undefined) {
    editor.chain().focus().setMark('sageMark', { sageId, sageText }).run();
  } else {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: sageText,
        marks: [{ type: 'sageMark', attrs: { sageId, sageText } }],
      })
      .run();
  }
  editor.chain().unsetMark('sageMark').run();
}

/** Removes all sageMark marks with the given sageId from the entire document. */
export function removeSageMark(editor: Editor, sageId: string) {
  const { doc, tr } = editor.state;
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const sageMarks = node.marks.filter(
      (m) => m.type.name === 'sageMark' && m.attrs.sageId === sageId,
    );
    if (sageMarks.length > 0) {
      sageMarks.forEach((mark) => {
        tr.removeMark(pos, pos + node.nodeSize, mark.type);
      });
    }
  });
  if (tr.docChanged) {
    editor.view.dispatch(tr);
  }
}
