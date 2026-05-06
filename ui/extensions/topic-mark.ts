import { Node } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export interface TopicAttrs {
  topicId: string;
  topicText: string;
}

/**
 * Atomic inline node for a topic mention. Cursor cannot be placed inside;
 * deleting one character removes the whole entity.
 */
export const TopicMarkExtension = Node.create({
  name: 'topicMark',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      topicId: { default: null },
      topicText: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-topic-id]',
        getAttrs: (el) => {
          if (typeof el === 'string') return false;
          return {
            topicId: el.getAttribute('data-topic-id'),
            topicText: el.textContent ?? '',
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
        'data-topic-id': node.attrs.topicId,
        class: 'topic-mark inline-block rounded bg-blue-100 px-1 text-blue-800',
      },
      node.attrs.topicText,
    ];
  },

  // Make the node's text contribute to editor.getText() / contentLength.
  renderText({ node }) {
    return (node.attrs.topicText as string) ?? '';
  },
});

/**
 * Inserts a topic atom node at the current cursor position.
 * If text is selected, the selection is replaced by the topic node.
 */
export function insertTopic(
  editor: Editor,
  topicId: string,
  topicText: string,
  selectedText?: string,
) {
  const { from, to, empty } = editor.state.selection;
  const display = !empty && selectedText !== undefined ? selectedText : topicText;
  const chain = editor.chain().focus();
  if (!empty) {
    chain.deleteRange({ from, to });
  }
  chain
    .insertContent({
      type: 'topicMark',
      attrs: { topicId, topicText: display },
    })
    .run();
}

/** Removes all topic atom nodes with the given topicId from the entire document. */
export function removeTopicMark(editor: Editor, topicId: string) {
  const { doc, tr } = editor.state;
  const positions: { from: number; to: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'topicMark' && node.attrs.topicId === topicId) {
      positions.push({ from: pos, to: pos + node.nodeSize });
    }
  });
  // Walk in reverse so earlier positions stay valid.
  for (let i = positions.length - 1; i >= 0; i--) {
    tr.delete(positions[i].from, positions[i].to);
  }
  if (tr.docChanged) {
    editor.view.dispatch(tr);
  }
}
