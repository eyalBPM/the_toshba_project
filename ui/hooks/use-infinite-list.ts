'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

interface UseInfiniteListOptions {
  url: string;
  queryKey: string[];
  params?: Record<string, string>;
  enabled?: boolean;
}

interface PageData<T> {
  items: T[];
  nextCursor: string | null;
}

export function useInfiniteList<T extends { id: string }>({
  url,
  queryKey,
  params = {},
  enabled = true,
}: UseInfiniteListOptions) {
  const query = useInfiniteQuery<PageData<T>>({
    queryKey: [...queryKey, params],
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams(params);
      if (pageParam) searchParams.set('cursor', pageParam as string);
      const res = await fetch(`${url}?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      const data = json.data;
      // Support both { items, nextCursor } and array responses
      if (Array.isArray(data)) {
        const limit = parseInt(params.limit ?? '20', 10) || 20;
        const hasMore = data.length === limit;
        return {
          items: data as T[],
          nextCursor: hasMore && data.length > 0 ? (data[data.length - 1] as T).id : null,
        };
      }
      return data as PageData<T>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
