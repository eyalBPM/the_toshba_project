'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { SourceCitationExtension } from '@/ui/extensions/source-citation';
import { TopicMarkExtension } from '@/ui/extensions/topic-mark';
import { SageMarkExtension } from '@/ui/extensions/sage-mark';
import { ReferenceMarkExtension } from '@/ui/extensions/reference-mark';
import { ImageNodeExtension } from '@/ui/extensions/image-node';
import { useSources } from '@/ui/hooks/use-sources';
import { SourceFooter } from './tiptap-editor/source-footer';

interface ContentRendererProps {
  content: unknown;
  className?: string;
}

/**
 * Read-only TipTap viewer. Renders TipTap JSON including custom nodes/marks:
 * source citations ([n]), topic marks, sage marks, article references.
 */
export function ContentRenderer({ content, className = '' }: ContentRendererProps) {
  const sources = useSources();

  const editor = useEditor({
    extensions: [
      StarterKit,
      SourceCitationExtension,
      TopicMarkExtension,
      SageMarkExtension,
      ReferenceMarkExtension,
      ImageNodeExtension,
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
        <EditorContent editor={editor} />
      </div>
      <SourceFooter editor={editor} sources={sources} />
    </div>
  );
}
