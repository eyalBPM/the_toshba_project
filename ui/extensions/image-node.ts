'use client';

import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import React from 'react';
import { useImageVisibility } from '@/ui/components/image-visibility-context';

function ImageNodeView(props: ReactNodeViewProps) {
  const { src, imageId } = props.node.attrs;
  const { isOwner, imageStatuses } = useImageVisibility();

  if (!isOwner) {
    const status = imageStatuses[imageId];
    if (status === 'Rejected') {
      return React.createElement(NodeViewWrapper, { className: 'my-2' });
    }
    if (status !== 'Approved') {
      return React.createElement(
        NodeViewWrapper,
        { className: 'my-2' },
        React.createElement(
          'div',
          {
            className:
              'flex items-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-sm text-gray-500',
          },
          React.createElement('span', { 'aria-hidden': true }, '📷'),
          React.createElement('span', null, 'תמונה ממתינה לאישור הניהול'),
        ),
      );
    }
  }

  return React.createElement(
    NodeViewWrapper,
    { className: 'my-2' },
    React.createElement('img', {
      src,
      alt: '',
      className: 'max-w-full rounded-md border border-gray-200',
      draggable: false,
    }),
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
  attrs: { src: string; imageId: string },
) {
  editor
    .chain()
    .focus()
    .insertContent({ type: 'uploadedImage', attrs })
    .run();
}
