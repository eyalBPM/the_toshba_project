import { Mark } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export interface TopicAttrs {
  topicId: string;
  topicText: string;
}

/**
 * Inline mark for topic mentions. Styled in blue.
 * inclusive: false — typing immediately after a topic mark does not extend it.
 */
export const TopicMarkExtension = Mark.create({
  name: 'topicMark',

  addAttributes() {
    return {
      topicId: { default: null },
      topicText: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-topic-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-topic-id': HTMLAttributes.topicId,
        class: 'topic-mark inline-block rounded bg-blue-100 px-1 text-blue-800',
      },
      0,
    ];
  },

  inclusive: false,
});

/** Inserts a topic mark at the current cursor position, or wraps selected text. */
export function insertTopic(
  editor: Editor,
  topicId: string,
  topicText: string,
  selectedText?: string,
) {
  const { from, to, empty } = editor.state.selection;
  if (!empty && selectedText !== undefined) {
    // Wrap existing selection
    editor
      .chain()
      .focus()
      .setMark('topicMark', { topicId, topicText })
      .run();
  } else {
    // Insert the topic text with the mark at cursor
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: topicText,
        marks: [{ type: 'topicMark', attrs: { topicId, topicText } }],
      })
      .run();
  }
  // Unset mark so subsequent typing is plain
  editor.chain().unsetMark('topicMark').run();
  void from; void to;
}

/** Removes all topicMark marks with the given topicId from the entire document. */
export function removeTopicMark(editor: Editor, topicId: string) {
  const { doc, tr } = editor.state;
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const topicMarks = node.marks.filter(
      (m) => m.type.name === 'topicMark' && m.attrs.topicId === topicId,
    );
    if (topicMarks.length > 0) {
      topicMarks.forEach((mark) => {
        tr.removeMark(pos, pos + node.nodeSize, mark.type);
      });
    }
  });
  if (tr.docChanged) {
    editor.view.dispatch(tr);
  }
}
