'use client';

import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { insertImage } from '@/ui/extensions/image-node';

interface ImageUploadButtonProps {
  editor: Editor;
  revisionId: string;
}

export function ImageUploadButton({ editor, revisionId }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function handleClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/revisions/${revisionId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const image = json.data;
        insertImage(editor, {
          src: image.url,
          imageId: image.id,
          status: image.status,
        });
      } else {
        const json = await res.json();
        alert(json.error?.message ?? 'שגיאה בהעלאת התמונה');
      }
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        title="העלאת תמונה"
      >
        {uploading ? 'מעלה...' : 'תמונה'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
