'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { SourceCitationExtension } from '@/ui/extensions/source-citation';
import { TopicMarkExtension } from '@/ui/extensions/topic-mark';
import { SageMarkExtension } from '@/ui/extensions/sage-mark';
import { ReferenceMarkExtension } from '@/ui/extensions/reference-mark';
import { ImageNodeExtension } from '@/ui/extensions/image-node';
import { TableExtensions } from '@/ui/extensions/table';
import { ImageVisibilityProvider } from '@/ui/components/image-visibility-context';
import type { ImageStatusMap } from '@/lib/image-status-map';

interface ContentRendererProps {
  content: unknown;
  isOwner: boolean;
  imageStatuses: ImageStatusMap;
  className?: string;
}

/**
 * Read-only TipTap viewer. Renders TipTap JSON including custom nodes/marks:
 * source citations ([n]), topic marks, sage marks, article references.
 */
export function ContentRenderer({
  content,
  isOwner,
  imageStatuses,
  className = '',
}: ContentRendererProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      SourceCitationExtension,
      TopicMarkExtension,
      SageMarkExtension,
      ReferenceMarkExtension,
      ImageNodeExtension,
      ...TableExtensions,
    ],
    content: (content as object | null) ?? {},
    editable: false,
    immediatelyRender: false,
  });

  if (!content) {
    return <p className="text-gray-400">(אין תוכן)</p>;
  }

  return (
    <div className={className} dir="rtl">
      <div className="prose prose-sm max-w-none">
        <ImageVisibilityProvider value={{ isOwner, imageStatuses }}>
          <EditorContent editor={editor} />
        </ImageVisibilityProvider>
      </div>
    </div>
  );
}
