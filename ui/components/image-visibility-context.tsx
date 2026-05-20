'use client';

import { createContext, useContext } from 'react';
import type { ImageStatusMap } from '@/lib/image-status-map';

export interface ImageVisibility {
  isOwner: boolean;
  imageStatuses: ImageStatusMap;
}

const DEFAULT: ImageVisibility = { isOwner: false, imageStatuses: {} };

const ImageVisibilityContext = createContext<ImageVisibility>(DEFAULT);

export function ImageVisibilityProvider({
  value,
  children,
}: {
  value: ImageVisibility;
  children: React.ReactNode;
}) {
  return (
    <ImageVisibilityContext.Provider value={value}>
      {children}
    </ImageVisibilityContext.Provider>
  );
}

export function useImageVisibility(): ImageVisibility {
  return useContext(ImageVisibilityContext);
}
