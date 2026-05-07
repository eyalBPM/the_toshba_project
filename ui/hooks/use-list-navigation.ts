'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface ListNavigation {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  handleKeyDown: (e: KeyboardEvent) => boolean;
  setItemRef: (index: number) => (el: HTMLElement | null) => void;
}

export function useListNavigation(itemCount: number): ListNavigation {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    setActiveIndex(0);
  }, [itemCount]);

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): boolean => {
      if (itemCount === 0) return false;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(activeIndex >= itemCount - 1 ? 0 : activeIndex + 1);
        return true;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(activeIndex <= 0 ? itemCount - 1 : activeIndex - 1);
        return true;
      }
      return false;
    },
    [itemCount, activeIndex],
  );

  const setItemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    [],
  );

  return { activeIndex, setActiveIndex, handleKeyDown, setItemRef };
}
