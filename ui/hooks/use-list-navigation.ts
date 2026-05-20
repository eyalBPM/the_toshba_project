'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface ListNavigation<T> {
  activeIndex: number;
  activeItem: T | null;
  setActiveIndex: (index: number) => void;
  handleKeyDown: (e: KeyboardEvent) => boolean;
  setItemRef: (key: string) => (el: HTMLElement | null) => void;
}

export function useListNavigation<T>(
  items: T[],
  getKey: (item: T) => string,
): ListNavigation<T> {
  const [activeKey, setActiveKey] = useState<string | null>(() =>
    items[0] ? getKey(items[0]) : null,
  );
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (items.length === 0) {
      if (activeKey !== null) setActiveKey(null);
      return;
    }
    if (activeKey === null || !items.some((it) => getKey(it) === activeKey)) {
      setActiveKey(getKey(items[0]));
    }
  }, [items, activeKey, getKey]);

  const activeIndex =
    activeKey === null ? -1 : items.findIndex((it) => getKey(it) === activeKey);

  useEffect(() => {
    if (activeKey === null) return;
    const el = itemRefs.current.get(activeKey);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeKey]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): boolean => {
      if (items.length === 0) return false;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next =
          activeIndex < 0 || activeIndex >= items.length - 1 ? 0 : activeIndex + 1;
        setActiveKey(getKey(items[next]));
        return true;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
        setActiveKey(getKey(items[next]));
        return true;
      }
      return false;
    },
    [items, activeIndex, getKey],
  );

  const setItemRef = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) itemRefs.current.set(key, el);
      else itemRefs.current.delete(key);
    },
    [],
  );

  return {
    activeIndex,
    activeItem: activeIndex >= 0 ? items[activeIndex] : null,
    setActiveIndex: (i: number) => {
      if (items[i]) setActiveKey(getKey(items[i]));
    },
    handleKeyDown,
    setItemRef,
  };
}
