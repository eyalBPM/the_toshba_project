import { Node } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

export interface ReferenceAttrs {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
}

/**
 * Atomic inline node for an internal article reference. Cursor cannot be
 * placed inside; deleting one character removes the whole entity.
 */
export const ReferenceMarkExtension = Node.create({
  name: 'referenceMark',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      articleId: { default: null },
      articleSlug: { default: null },
      articleTitle: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-article-id]',
        getAttrs: (el) => {
          if (typeof el === 'string') return false;
          return {
            articleId: el.getAttribute('data-article-id'),
            articleSlug: el.getAttribute('data-article-slug') ?? '',
            articleTitle: el.textContent ?? '',
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'a',
      {
        ...HTMLAttributes,
        href: `/articles/${node.attrs.articleSlug}`,
        'data-article-id': node.attrs.articleId,
        'data-article-slug': node.attrs.articleSlug,
        class: 'reference-mark text-blue-600 underline cursor-pointer',
      },
      node.attrs.articleTitle,
    ];
  },

  renderText({ node }) {
    return (node.attrs.articleTitle as string) ?? '';
  },
});

/** Inserts a reference atom node, replacing any selected text with it. */
export function insertReference(
  editor: Editor,
  article: { id: string; slug: string; title: string },
  selectedText?: string,
) {
  const { from, to, empty } = editor.state.selection;
  const display = !empty && selectedText !== undefined ? selectedText : article.title;
  const chain = editor.chain().focus();
  if (!empty) {
    chain.deleteRange({ from, to });
  }
  chain
    .insertContent({
      type: 'referenceMark',
      attrs: {
        articleId: article.id,
        articleSlug: article.slug,
        articleTitle: display,
      },
    })
    .run();
}
