'use client';

import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import React from 'react';

function ImageNodeView(props: ReactNodeViewProps) {
  const { src, imageId, status } = props.node.attrs;
  const isPending = status === 'PendingApproval';

  return React.createElement(
    NodeViewWrapper,
    { className: 'my-2' },
    React.createElement(
      'div',
      { className: 'relative inline-block max-w-full' },
      React.createElement('img', {
        src,
        alt: '',
        className: `max-w-full rounded-md border ${isPending ? 'border-amber-300 opacity-75' : 'border-gray-200'}`,
        draggable: false,
      }),
      isPending &&
        React.createElement(
          'span',
          {
            className:
              'absolute top-2 right-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-white',
          },
          'ממתין לאישור',
        ),
    ),
  );
}

export const ImageNodeExtension = Node.create({
  name: 'uploadedImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: '' },
      imageId: { default: '' },
      status: { default: 'PendingApproval' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="uploaded-image"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-type': 'uploaded-image',
        'data-src': HTMLAttributes.src,
        'data-image-id': HTMLAttributes.imageId,
        'data-status': HTMLAttributes.status,
      },
      ['img', { src: HTMLAttributes.src, alt: '' }],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

export function insertImage(
  editor: InstanceType<typeof import('@tiptap/core').Editor>,
  attrs: { src: string; imageId: string; status: string },
) {
  editor
    .chain()
    .focus()
    .insertContent({ type: 'uploadedImage', attrs })
    .run();
}
