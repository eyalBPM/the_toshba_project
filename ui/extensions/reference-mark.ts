import { Mark } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export interface ReferenceAttrs {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
}

/**
 * Inline mark for internal article references (links to other articles).
 * All links in this editor are article references — no external link support.
 */
export const ReferenceMarkExtension = Mark.create({
  name: 'referenceMark',

  addAttributes() {
    return {
      articleId: { default: null },
      articleSlug: { default: null },
      articleTitle: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-article-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      {
        ...HTMLAttributes,
        href: `/articles/${HTMLAttributes.articleSlug}`,
        'data-article-id': HTMLAttributes.articleId,
        class: 'reference-mark text-blue-600 underline cursor-pointer',
      },
      0,
    ];
  },

  inclusive: false,
});

/** Inserts a reference mark at cursor position or wraps selected text. */
export function insertReference(
  editor: Editor,
  article: { id: string; slug: string; title: string },
  selectedText?: string,
) {
  const attrs: ReferenceAttrs = {
    articleId: article.id,
    articleSlug: article.slug,
    articleTitle: article.title,
  };
  const { empty } = editor.state.selection;
  if (!empty && selectedText !== undefined) {
    editor.chain().focus().setMark('referenceMark', attrs).run();
  } else {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: article.title,
        marks: [{ type: 'referenceMark', attrs }],
      })
      .run();
  }
  editor.chain().unsetMark('referenceMark').run();
}
