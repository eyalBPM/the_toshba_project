'use client';

import { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerProps {
  onTrigger: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function InfiniteScrollTrigger({
  onTrigger,
  hasMore,
  isLoading,
}: InfiniteScrollTriggerProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onTrigger();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onTrigger, hasMore, isLoading]);

  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="py-4 text-center">
      {isLoading && <span className="text-sm text-gray-400">טוען...</span>}
    </div>
  );
}
